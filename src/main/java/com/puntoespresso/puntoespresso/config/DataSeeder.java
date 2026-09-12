package com.puntoespresso.puntoespresso.config;

import com.puntoespresso.puntoespresso.dto.Categoria;
import com.puntoespresso.puntoespresso.dto.Producto;
import com.puntoespresso.puntoespresso.dto.Sede;
import com.puntoespresso.puntoespresso.repository.CategoriaRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.SedeRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataSeeder implements CommandLineRunner {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;
    private final SedeRepository sedeRepository;

    public DataSeeder(CategoriaRepository categoriaRepository, ProductoRepository productoRepository, SedeRepository sedeRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
        this.sedeRepository = sedeRepository;
    }

    @Override
    public void run(String... args) {
        Categoria bebidas;
        Categoria cafeEnGrano;

        if (categoriaRepository.count() == 0) {
            bebidas = categoriaRepository.save(new Categoria("Bebidas"));
            cafeEnGrano = categoriaRepository.save(new Categoria("Café en Grano"));
        } else {
            bebidas = categoriaRepository.findAll().stream()
                    .filter(c -> "Bebidas".equals(c.getNombre()))
                    .findFirst().orElseThrow();
            cafeEnGrano = categoriaRepository.findAll().stream()
                    .filter(c -> "Café en Grano".equals(c.getNombre()))
                    .findFirst().orElseThrow();
        }

        if (productoRepository.count() == 0) {
            productoRepository.saveAll(List.of(
                new Producto(bebidas, "Frappé Mocha", 14.50, "Espresso, chocolate premium, hielo y crema batida.", 12, "frappe-mocha.jpg"),
                new Producto(cafeEnGrano, "Café Geisha Grano", 45.00, "Café premium de origen con notas florales pronunciadas.", 5, "cafe-geisha.jpg"),
                new Producto(bebidas, "Café Americano", 8.50, "Espresso diluido en agua caliente, sabor limpio y equilibrado.", 20, "cafe-americano.jpg"),
                new Producto(bebidas, "Cappuccino", 11.00, "Espresso con leche vaporizada y espuma cremosa en partes iguales.", 18, "cappuccino.jpg"),
                new Producto(bebidas, "Café Latte", 12.00, "Espresso suave con abundante leche vaporizada y poca espuma.", 16, "cafe-latte.jpg"),
                new Producto(bebidas, "Frappé Vainilla", 14.00, "Base de café, sirope de vainilla, hielo y crema batida.", 14, "frappe-vainilla.jpg"),
                new Producto(bebidas, "Cold Brew", 13.50, "Café de extracción en frío durante 12 horas, suave y concentrado.", 10, "cold-brew.jpg"),
                new Producto(bebidas, "Té Matcha Frío", 12.50, "Té matcha premium japonés con leche de avena y hielo.", 15, "te-matcha-frio.jpg"),
                new Producto(bebidas, "Chocolate Frío", 10.00, "Chocolate oscuro belga con leche entera y hielo triturado.", 20, "chocolate-frio.jpg"),
                new Producto(bebidas, "Mocaccino", 13.00, "Espresso con chocolate, leche vaporizada y toque de canela.", 12, "mocaccino.jpg")
            ));
        }

        if (sedeRepository.count() == 0) {
            sedeRepository.saveAll(List.of(
                new Sede("Cafetería La Marina", "Avenida de la Marina 2500, San Miguel, Perú", "Lunes a Domingo", "10:30 — 21:00"),
                new Sede("Tostaduría (Planta)", "Jirón Teniente Carlos Jimenez Chavez 147, Lima, Perú", "Lunes a Sábado", "08:00 — 18:00"),
                new Sede("Cafetería San Isidro", "Avenida Paseo de la República 3440, San Isidro, Perú", "Lunes a Domingo", "08:00 — 21:30")
            ));
        }
    }
}