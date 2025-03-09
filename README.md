# ComfyUI Workflow Extractor

![Screenshot showing a preview of the web application](https://raw.githubusercontent.com/spooee/comfyui-workflow-extractor/refs/heads/main/preview.png)

A simple web application that extracts workflow data and prompts from Stable Diffusion images generated in [ComfyUI](https://github.com/comfyanonymous/ComfyUI).

You can upload .PNG images and preview the workflow as it would look in ComfyUI.

You can click the "Download Workflow" button after uploading an image. This will download a .JSON file which you can open in ComfyUI to open the workflow used to generate that image.

## Try it out
I'm hosting this web application over at https://clu.st/comfyui

## Stack
The frontend is created with React and Tailwind.

The workflow preview is rendered with LiteGraph.js.

The metadata extraction is done with png-chunks-extract to parse image metadata.

There is no backend! It runs fully client-side. No images are stored or transmitted.


## Local installation
If you want to modify or run this locally:

### Clone the repository
```
git clone https://github.com/spooee/comfyui-workflow-extractor.git
cd comfyui-workflow-extractor
```

### Install dependencies
```
yarn install
```

### Run! Server should start at https://localhost:3000
```
yarn start
```

