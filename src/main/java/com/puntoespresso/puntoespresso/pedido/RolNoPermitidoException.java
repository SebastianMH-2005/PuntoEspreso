package com.puntoespresso.puntoespresso.pedido;

public class RolNoPermitidoException extends RuntimeException {
    public RolNoPermitidoException(String mensaje) {
        super(mensaje);
    }
}