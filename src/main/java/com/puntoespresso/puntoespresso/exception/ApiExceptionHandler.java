package com.puntoespresso.puntoespresso.exception;

import com.puntoespresso.puntoespresso.controller.ApiController;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

// assignableTypes = ApiController.class limita este manejador a la API REST.
// Así, si algo falla en TiendaController (vistas Thymeleaf), se sigue mostrando
// una página de error normal en vez de forzar una respuesta JSON.
@ControllerAdvice(assignableTypes = ApiController.class)
public class ApiExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    @ResponseBody
    public ResponseEntity<ErrorResponse> manejarNoEncontrado(RecursoNoEncontradoException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                HttpStatus.NOT_FOUND.getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    // Red de seguridad: cualquier otro error inesperado en la API también sale como JSON,
    // sin exponer detalles internos (stack traces) al cliente.
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<ErrorResponse> manejarErrorGeneral(Exception ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                "Ocurrió un error inesperado. Intenta de nuevo más tarde.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
