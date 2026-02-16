# Devil n Dove site v2 (logo + copy)

Upload this folder to Cloudflare Pages (Direct Upload) OR push it to Git and use Git integration.

Key files:
- /assets/ logo images
- /data/catalog.json  (movies UPC list)
- /data/products.json (shop items)


- /data/tools.json (tools & supplies list)
- /assets/tools/ (tool photos)


## Toolshed

The tools page lives at `/tools/index.html` and is driven by `/data/tools.json`.

- Add a new tool: drop an image into `/assets/tools/` and add a new entry in `/data/tools.json`.
- The page automatically builds categories and search/filter UI.

If you’re using Shopify, you can also paste the content from `/tools/index.html` into a Page (Online Store → Pages) and upload the images to your theme files, but hosting the site as-is is the simplest.
