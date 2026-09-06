from app import create_app

app = create_app()

if __name__ == "__main__":
    # threaded=True: sin esto, el servidor de desarrollo de Flask atiende
    # UNA petición a la vez — cualquier pantalla que pida varias cosas en
    # paralelo (ej. carpetas + recientes del Dashboard, o mensajes + "está
    # escribiendo" de Chats) las procesaba en fila, no en simultáneo, lo que
    # se sentía como lentitud aunque cada consulta individual fuera rápida.
    app.run(debug=True, threaded=True)
