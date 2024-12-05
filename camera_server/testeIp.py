import cv2

# Endereço do stream RTSP (substitua pelo endereço correto da sua câmera)
rtsp_url = 'http://admin:admin@143.106.61.220'

# Abrir a câmera IP usando o OpenCV
cap = cv2.VideoCapture(rtsp_url)

# Verificar se a câmera foi aberta corretamente
if not cap.isOpened():
    print("Erro: Não foi possível acessar o stream da câmera IP.")
    exit()

while True:
    # Capturar frame por frame
    ret, frame = cap.read()

    # Se a captura for bem-sucedida, ret será True
    if not ret:
        print("Erro: Não foi possível capturar o frame.")
        break

    # Exibir o frame na janela
    cv2.imshow('Câmera IP', frame)

    # Esperar até pressionar a tecla 'q' para sair
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Libere a câmera e feche as janelas
cap.release()
cv2.destroyAllWindows()
