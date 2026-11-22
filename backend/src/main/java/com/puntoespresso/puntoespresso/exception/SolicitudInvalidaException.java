package com.puntoespresso.puntoespresso.exception;

// Datos del pedido que no cumplen una regla de negocio: se responde 400
public class SolicitudInvalidaException extends RuntimeException {
    public SolicitudInvalidaException(String mensaje) {
        super(mensaje);
    }
}