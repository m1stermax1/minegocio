from PIL import Image, ImageDraw
import barcode
from barcode.writer import ImageWriter
import os


TEMP_DIR = "temp"


def generate_label(code):

    os.makedirs(TEMP_DIR, exist_ok=True)

    filename = os.path.join(
        TEMP_DIR,
        code
    )

    barcode_class = barcode.get_barcode_class("code128")

    barcode_image = barcode_class(
        code,
        writer=ImageWriter()
    )


    path = barcode_image.save(filename)


    img = Image.open(path)

    img = img.rotate(90, expand=True)

    img = img.resize(
        (96,300)
    )


    final_path = f"{filename}.png"

    img.save(final_path)


    return final_path