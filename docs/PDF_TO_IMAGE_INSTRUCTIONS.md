# Converting PDFs to Images for Coordinate Mapping

If you want to add visual form preview to the coordinate mapper, you can convert PDFs to images:

## Option 1: Online Conversion
1. Go to https://pdf2png.com/ or similar
2. Upload your PDF (SF24-23a.pdf)
3. Download the PNG image
4. Save as `public/images/sf24-23a-form.png`

## Option 2: Command Line (if you have ImageMagick)
```bash
convert -density 150 public/docs/sample-pdfs/SF24-23a.pdf[0] public/images/sf24-23a-form.png
```

## Option 3: Use the Current System
The coordinate mapper works perfectly without images! It:
- Calculates coordinates relative to standard 8.5x11 page (612x792 points)
- Provides visual feedback when clicking
- Exports accurate JSON coordinates
- Works with any form size

## To Add Image Support
If you add an image, update the component to load it:
```jsx
<img 
  ref={imageRef}
  src="/images/sf24-23a-form.png"
  alt="SF24-23A Form"
  onLoad={handleImageLoad}
  onError={handleImageError}
  onClick={handleImageClick}
  className="w-full cursor-crosshair"
/>
```
