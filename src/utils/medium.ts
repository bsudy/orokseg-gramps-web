import { PBMediumRef } from "../pages/photoBookModel";

export const getCutout = (medium: PBMediumRef): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rect = medium.rect;
    if (!rect) {
      resolve(medium.contentUrl);
      return;
    }
    const [x1, y1, x2, y2] = rect;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const sx = Math.min(x1, x2);
    const sy = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    // console.log("rect", rect);
    // console.log("sx", sx, "sy", sy, "width", width, "height", height);

    var image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const w = image.width * (width / 100);
        const h = image.height * (height / 100);
        const x = image.width * (sx / 100);
        const y = image.height * (sy / 100);
        canvas.width = w;
        canvas.height = h;
        // console.log("w", w, "h", h, "x", x, "y", y);
        ctx.drawImage(image, x, y, w, h, 0, 0, w, h);
        resolve(canvas.toDataURL());
      } catch (e) {
        reject(e);
      }
    };
    image.src = medium.contentUrl;

    // THIS IS WRONG! It can be added only later. I think it's better to create a component.
  });
};
