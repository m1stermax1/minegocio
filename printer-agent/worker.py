import requests
import time
from label_generator import generate_label
from printer import NiimbotPrinter

printer = NiimbotPrinter("COM3")

API_URL = "https://minegocio-18kr.onrender.com/inventory/print-jobs/pending"


def check_jobs():

    response = requests.get(API_URL)

    if response.status_code != 200:
        print("Error consultando cola")
        return None

    return response.json()



while True:

    job = check_jobs()

    if job:
        
        try:

            image = generate_label(job["barcode"])

            printer.print_image(image)

            requests.patch(
                f"{API_URL}/inventory/print-jobs/{job['id']}",
                json={
                    "status": "completed"
                }
            )

            print(f"Trabajo {job['id']} completado")

        except Exception as e:

            print("Error imprimiendo:", e)
    else:

        print("Sin trabajos")


    time.sleep(5)