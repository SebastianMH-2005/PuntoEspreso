package com.puntoespresso.puntoespresso;

import com.puntoespresso.puntoespresso.entity.Cliente;
import com.puntoespresso.puntoespresso.repository.ClienteRepository;
import com.puntoespresso.puntoespresso.repository.ProductoRepository;
import com.puntoespresso.puntoespresso.repository.UsuarioSistemaRepository;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Crea la base SOLO con las migraciones de Flyway (Hibernate no toca las tablas) y arranca toda la
// aplicación: el DataSeeder inserta datos en las tablas, así que un nombre de tabla o columna de las
// migraciones que no coincida con las entidades haría fallar esta prueba.
@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:migraciones;DB_CLOSE_DELAY=-1",
        "spring.flyway.enabled=true",
        "spring.flyway.baseline-on-migrate=false",
        "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class MigracionesTest {

    @Autowired
    Flyway flyway;
    @Autowired
    ProductoRepository productoRepository;
    @Autowired
    UsuarioSistemaRepository usuarioSistemaRepository;
    @Autowired
    ClienteRepository clienteRepository;

    @Test
    void lasMigracionesSeAplicanYLaAplicacionArrancaSobreEseEsquema() {
        assertThat(flyway.info().applied()).hasSize(3);
        assertThat(flyway.info().pending()).isEmpty();
        assertThat(productoRepository.count()).isEqualTo(10); // cargados por el DataSeeder
        assertThat(usuarioSistemaRepository.count()).isEqualTo(1);
    }

    @Test
    void elEmailDeUnClienteNoPuedeRepetirse() {
        clienteRepository.saveAndFlush(new Cliente("Ana", "10000001", "repetido@test.pe", "hash", "900000001"));

        assertThatThrownBy(() -> clienteRepository.saveAndFlush(
                new Cliente("Beto", "10000002", "repetido@test.pe", "hash", "900000002")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void elDniDeUnClienteNoPuedeRepetirse() {
        clienteRepository.saveAndFlush(new Cliente("Ana", "10000003", "ana@test.pe", "hash", "900000003"));

        assertThatThrownBy(() -> clienteRepository.saveAndFlush(
                new Cliente("Beto", "10000003", "beto@test.pe", "hash", "900000004")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}