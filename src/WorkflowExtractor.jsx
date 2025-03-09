import React, { useState } from 'react';
import { ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import extractChunks from 'png-chunks-extract';
import GraphCanvas from './GraphCanvas';

function PromptExtractor() {
  const [workflow, setWorkflow] = useState(null);
  const [positivePrompts, setPositivePrompts] = useState([]);
  const [negativePrompts, setNegativePrompts] = useState([]);
  const [error, setError] = useState('');

  //Handles file selection, reads PNG metadata, and extracts workflow data.
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setWorkflow(null);
    setPositivePrompts([]);
    setNegativePrompts([]);
    setError('');

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      try {
        const uint8Array = new Uint8Array(arrayBuffer);
        const chunks = extractChunks(uint8Array);

        let foundWorkflow = false;
        let parsedWorkflow = null;

        chunks.forEach((chunk) => {
          if (chunk.name === 'tEXt' || chunk.name === 'iTXt') {
            let chunkText = new TextDecoder('utf-8').decode(chunk.data).trim();
            const workflowPattern = /^workflow\s*.*?\{/s;

            if (workflowPattern.test(chunkText)) {
              chunkText = chunkText.replace(workflowPattern, '"workflow": {');
              const fixedText = `{${chunkText}}`;

              try {
                parsedWorkflow = JSON.parse(fixedText);

                if (parsedWorkflow.workflow || parsedWorkflow.nodes) {
                  setWorkflow(parsedWorkflow.workflow || parsedWorkflow);
                  foundWorkflow = true;

                  extractPromptsFromNodes(
                    parsedWorkflow.nodes || parsedWorkflow.workflow?.nodes || [],
                    parsedWorkflow.links || parsedWorkflow.workflow?.links || []
                  );
                }
              } catch (err) {
                console.warn("Invalid JSON format in extracted workflow data.");
              }
            }
          }
        });

        if (!foundWorkflow) {
          setError('No workflow information found in this image.');
        }
      } catch (err) {
        console.error('Error processing image file.');
        setError('Error extracting workflow data from image.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

   // Extracts positive and negative text prompts from the workflow nodes.
  const extractPromptsFromNodes = (nodes, links) => {
    let positive = [];
    let negative = [];

    if (!nodes || nodes.length === 0) {
      console.warn("No nodes found in workflow.");
      return;
    }

    nodes.forEach((node) => {
      if (node.type === "CLIPTextEncode" && Array.isArray(node.widgets_values) && node.widgets_values.length > 0) {
        const textPrompt = node.widgets_values[0]; // Extract prompt text
        let isNegative = false;

        // Check if the node is linked to a "negative" input slot
        links.forEach((link) => {
          if (link[1] === node.id) {
            const targetNode = nodes.find(n => n.id === link[3]);
            if (targetNode?.inputs?.[link[4]]?.name?.toLowerCase() === "negative") {
              isNegative = true;
            }
          }
        });

        if (isNegative) {
          negative.push(textPrompt);
        } else {
          positive.push(textPrompt);
        }
      }
    });

    setPositivePrompts(positive);
    setNegativePrompts(negative);
  };

  function transformLink(link) {
    return [
      Number(link.id),           // First element: link ID
      Number(link.origin_id),    // Second element: origin node ID
      Number(link.origin_slot),  // Third element: origin slot
      Number(link.target_id),    // Fourth element: target node ID
      Number(link.target_slot),  // Fifth element: target slot
      String(link.type)          // Sixth element: link type (e.g., "IMAGE", "LATENT", etc.)
    ];
  }

  function transformLinks(links) {
    return links
      .map((link) => (link ? transformLink(link) : null))
      .filter(link => link !== null);  // Ensures there are no null values
  }
  
  const downloadWorkflow = () => {
    if (!workflow) return;
  
    const workflowCopy = { ...workflow };
  
    if (workflowCopy.links && Array.isArray(workflowCopy.links)) {
      workflowCopy.links = transformLinks(workflowCopy.links);
    }
  
    const jsonStr = JSON.stringify(workflowCopy); // single-line JSON
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const linkEl = document.createElement('a');
    linkEl.href = url;
    linkEl.download = 'comfyui_workflow.json';
    linkEl.click();
    URL.revokeObjectURL(url);
  };

  return (
  <div className="min-h-screen bg-gray-900 text-gray-200">
    <header className="bg-gray-800 shadow">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-4xl font-extrabold text-gray-200 text-center">
          ComfyUI Workflow Extractor
        </h1>
        <p className="text-lg text-gray-400 text-center">
          Extract workflow data from an image generated by ComfyUI
        </p>
      </div>
    </header>
  
    {/* Main Content */}
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-400 mb-3 text-center">
          Upload a ComfyUI image to extract the workflow data.
        </p>
        <p className="text-sm text-gray-500 mb-6 italic text-center">
          Images are not stored or transmitted. Everything runs locally in your browser.
        </p>
        {/* File upload input */}
        <label className="cursor-pointer bg-blue-800 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-900 transition flex items-center gap-2 mb-6">
        <input type="file" accept="image/png" onChange={handleFileChange} className="hidden" />
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18v-1.5M7.5 9l4.5-4.5M12 4.5l4.5 4.5M12 15V4.5" />
        </svg>
        Upload Image
      </label>
  
        {error && <p className="text-red-500 mb-6">{error}</p>}
  
        {workflow && (
          <div className="w-full flex flex-col items-center">
            <GraphCanvas workflow={workflow} />
            <button
              onClick={downloadWorkflow} className="mt-4 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded flex items-center gap-2">
              <ArrowDownTrayIcon className="w-6 h-6" />
              Download Workflow
            </button>
          </div>
        )}
  
        {/* Display extracted prompts */}
        {(positivePrompts.length > 0 || negativePrompts.length > 0) && (
          <div className="mt-6 w-full bg-gray-800 border border-gray-600 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-200 mb-4">Extracted Prompts</h2>
  
            {positivePrompts.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-green-400">Positive Prompts</h3>
                <ul className="list-disc list-inside text-gray-300">
                  {positivePrompts.map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>
            )}
  
            {negativePrompts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-red-400">Negative Prompts</h3>
                <ul className="list-disc list-inside text-gray-300">
                  {negativePrompts.map((prompt, index) => (
                    <li key={index}>{prompt}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  </div>
  );
}

export default PromptExtractor;
