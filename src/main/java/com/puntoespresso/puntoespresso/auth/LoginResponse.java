package com.puntoespresso.puntoespresso.auth;

public record LoginResponse(String token, String nombre, String rol) {
}