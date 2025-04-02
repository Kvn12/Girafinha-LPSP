from flask import Flask, Response
import cv2

app = Flask(__name__)

def generate():
    cap = cv2.VideoCapture(0)

    # Aumentando a qualidade da captura de vídeo
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)  # Largura da resolução
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)  # Altura da resolução
    cap.set(cv2.CAP_PROP_FPS, 30)  # Taxa de quadros (opcional)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Ajustar a qualidade da imagem JPEG
        encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 95]
        _, buffer = cv2.imencode('.jpg', frame, encode_param)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed_0')
def video_feed():
    return Response(generate(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)