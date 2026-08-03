import requests
import time


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

        print("Trabajo encontrado:")
        print(job)

        # acá después llamamos niimprint

    else:

        print("Sin trabajos")


    time.sleep(5)