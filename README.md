# 💻 Desarrollo de Software — Trabajos Prácticos

![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-59666C?style=for-the-badge&logo=Hibernate&logoColor=white)
![Gradle](https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white)

Repositorio oficial del grupo para la asignatura **Desarrollo de Software** (*Ingeniería en Sistemas de Información — UTN, Ciclo Lectivo 2026*). Aquí se centralizan los trabajos prácticos, ejercicios de laboratorio y el proyecto integrador desarrollados durante la cursada.

---

## 📋 Descripción General

El objetivo de este repositorio es documentar la evolución práctica en el desarrollo de aplicaciones backend en Java, abarcando desde los fundamentos de programación orientada a objetos y manejo de colecciones hasta la persistencia relacional con ORM y el desarrollo de servicios con Spring Boot.

### 🛠️ Stack Tecnológico
* **Lenguaje:** Java
* **Frameworks y Persistencia:** Spring Boot, JPA / Hibernate, JPQL
* **Gestión de Dependencias y Build:** Gradle
* **Reportes y Documentos:** Generación de archivos PDF / TXT

---

## 📂 Estructura del Repositorio

El código está organizado en directorios independientes correspondientes a cada módulo y entrega de la materia:

| Módulo / Entrega | Directorio | Conceptos Abordados | Estado |
| :--- | :--- | :--- | :---: |
| **TP 05 — Colecciones e Identidad** | [`ToString-Equal-HashCode-Colecciones`](./ToString-Equal-HashCode-Colecciones) | Sobrescritura de `toString()`, `equals()` y `hashCode()`, manejo de estructuras `Set` y `List`. | ✅ Completado |
| **TP 08 — Persistencia ORM** | [`JPA-ORM-Hibernate`](./JPA-ORM-Hibernate) | Mapeo objeto-relacional, entidades, relaciones y gestión de persistencia con JPA e Hibernate. | ✅ Completado |
| **TP 09 — Consultas Avanzadas** | [`JPQL-Consultas`](./JPQL-Consultas) | Diseño y ejecución de consultas orientadas a objetos mediante JPQL. | ✅ Completado |
| **TP 10 — Fundamentos Spring Boot** | [`Spring-Boot`](./Spring-Boot) | Inyección de dependencias, arquitectura en capas (`Controller`, `Service`, `Repository`). | ✅ Completado |
| **Proyecto Integrador** | [`Sistema-Facturacion`](./Sistema-Facturacion) | Sistema de gestión de facturación con persistencia de datos y generación de reportes en PDF. | ✅ Completado |

---

## 👥 Integrantes del Equipo

| Apellido y Nombre | Legajo | GitHub |
| :--- | :---: | :---: |
| Cirrincione, Bruno | 51938 | [@Nuno000](https://github.com/Nuno000) |
| Rodríguez Quiñonez, Jessica Magaly | 48913 | [@jessi2001-cmd](https://github.com/jessi2001-cmd) |
| Sosa Avila, Florencia Natasha | 50716 | [@flornsa](https://github.com/flornsa) |
| Sosa, Renzo | 50173 | [@renzososa-cloud](https://github.com/renzososa-cloud) |

---

## 🚀 Cómo Ejecutar los Proyectos

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/jessi2001-cmd/desarrollo-software-grupo.git](https://github.com/jessi2001-cmd/desarrollo-software-grupo.git)
   cd desarrollo-software-grupo
   ```

2. **Abrir el módulo deseado:**
   * Importar cualquiera de los subdirectorios como proyecto **Gradle** en IntelliJ IDEA, Eclipse o VS Code.
   * Verificar que el SDK de Java esté configurado correctamente en el entorno.

3. **Ejecutar desde consola (en módulos con Gradle Wrapper):**
   ```bash
   ./gradlew bootRun
   ```