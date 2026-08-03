from niimprint import PrinterClient, SerialTransport
from PIL import Image


class NiimbotPrinter:

    def __init__(self, port="COM3"):
        self.transport = SerialTransport(port)
        self.printer = PrinterClient(self.transport)


    def print_image(self, file_path):

        image = Image.open(file_path)

        print("Enviando a impresora...")

        self.printer.print_image(
            image,
            density=3
        )

        print("Impresión enviada")