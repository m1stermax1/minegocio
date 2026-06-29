from niimprint import PrinterClient, SerialTransport
from PIL import Image
import sys

file_path = sys.argv[1]

transport = SerialTransport("COM3")
printer = PrinterClient(transport)

image = Image.open(file_path)

print("Conectado a impresora")
printer.print_image(image, density=3)
print("Imagen enviada")