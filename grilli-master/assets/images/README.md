# Menu Images

## Default Menu Images
The following images are used for the default menu items:
- `menu-1.png` - Greek Salad
- `menu-2.png` - Lasagne  
- `menu-3.png` - Butternut Pumpkin
- `menu-4.png` - Tokusen Wagyu
- `menu-5.png` - Olivas Rellenas
- `menu-6.png` - Opu Fish

## Adding New Menu Items
When adding new menu items through the "Add Items" page:

1. **Image Upload**: Users can upload their own images
2. **Image Processing**: Images are automatically resized to match the existing menu image dimensions (100x100 pixels)
3. **Storage**: Images are stored as base64 data in localStorage (for demo purposes)
4. **Display**: Images are displayed in the same size and style as existing menu images

## Image Requirements
- **Format**: JPG, PNG, GIF, WebP
- **Size**: Will be automatically resized to 100x100 pixels
- **Quality**: High quality images recommended for best results

## Technical Notes
- In a production environment, images should be uploaded to a server and stored as files
- The current implementation uses base64 encoding for demonstration purposes
- Image resizing is handled client-side using HTML5 Canvas API
- All images maintain aspect ratio and are cropped to fit the square format
