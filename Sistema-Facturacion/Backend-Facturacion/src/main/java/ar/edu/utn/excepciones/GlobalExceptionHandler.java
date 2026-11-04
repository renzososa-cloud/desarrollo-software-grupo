package ar.edu.utn.excepciones;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Maneja nuestra excepción personalizada (Equivalente al 404 Not Found)
    @ExceptionHandler(RecursoNoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse manejarRecursoNoEncontrado(RecursoNoEncontradoException ex) {
        return new ErrorResponse(404, ex.getMessage());
    }

    // Maneja cualquier otro error inesperado para que no rompa el servidor (Equivalente al 500 Internal Server Error)
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse manejarErrorGeneral(Exception ex) {
        return new ErrorResponse(500, "Se produjo un error inesperado en el servidor.");
    }
}