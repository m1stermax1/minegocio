import os

from flask import Flask, request, jsonify
from printer import NiimbotPrinter


app = Flask(__name__)

printer = NiimbotPrinter("COM3")

BASE_PATH = r"C:\Users\maxip\Desktop\minegocio\backend\temp"


@app.route("/print", methods=["POST"])
def print_label():

    import json

    try:
        raw = request.data.decode("utf-8")

        print("RAW:")
        print(raw)

        data = json.loads(raw)

        print("JSON:")
        print(data)


        image_path = os.path.join(
    BASE_PATH,
    data["image"]
)

        printer.print_image(image_path)

        return jsonify({
            "status": "success"
        })

    except Exception as e:
        print("ERROR:")
        print(e)

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.get("/status")
def status():
    return jsonify({
        "printer": "Niimbot D110",
        "port": "COM3",
        "online": True
    })

app.run(
    host="0.0.0.0",
    port=5001
)