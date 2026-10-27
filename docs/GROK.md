# Generar contenido con Grok

El contenido vive en `src/content/es/<tipo>.json`. No hace falta que Grok genere IDs:
le pides un array de `{ "level": n, "text": "..." }`, lo guardas en un archivo y lo importas:

```bash
npm run import -- verdad grok-verdad.json
npm run validate
```

El importador asigna IDs, descarta duplicados (aunque cambien tildes o mayúsculas) y limpia los
```` ```json ```` que a veces añade Grok.

## Tipos de carta

| Tipo (archivo)  | Qué es                                                     | Cómo empieza el texto            |
| --------------- | ---------------------------------------------------------- | -------------------------------- |
| `verdad`        | Pregunta a la persona que tiene el turno                   | `¿...?`                          |
| `reto`          | Una ACCIÓN que hace la persona del turno: con el cuerpo, el móvil (galería, chats, stories, llamadas) o con otro jugador. Nunca una pregunta disfrazada | Imperativo: `Haz…`, `Enseña…`, `Llama…`, `Deja que…`. Prohibido empezar por Confiesa, Revela o Cuenta |
| `yo-nunca`      | Frase para todos; bebe quien lo haya hecho                 | `Yo nunca he…`                   |
| `mas-probable`  | Todos señalan a alguien                                    | `¿Quién es más probable que…?`   |
| `todos`         | Carta para todo el grupo                                   | Libre                            |
| `duelo`         | Dos jugadores compiten; el perdedor bebe                   | `{jugador} contra {otro}: …`     |
| `regla`         | Norma que dura hasta la siguiente norma                    | Libre                            |

**Variables** (las sustituye la app por nombres reales): `{jugador}` = quien tiene el turno,
`{otro}` = otro jugador al azar. No uses otras variables, porque el validador las rechaza.

## Modo sin alcohol

La app cambia automáticamente "bebe/bebes/beben (N tragos)" por "cumple/cumples/cumplen penitencia".
`npm run validate` avisa si una carta no se puede convertir (p. ej. "pégale un sorbo"). En ese caso,
reescríbela con una de las formas de arriba o márcala con `"alcohol": true`.

Las penitencias están en `src/content/es/penitencias.json` (un array de textos; admite `{otro}`).
Tienen que ser rápidas (menos de 30 s), sin alcohol y sin gastar dinero.

## Niveles

1. **Suave**: para romper el hielo. Vale con gente que no se conoce mucho.
2. **Fiesta**: anécdotas de fiesta, ligar, vergüenza ajena, móviles.
3. **Picante**: preguntas íntimas y comprometidas (sentimientos, ex, celos, secretos, opiniones del grupo). **Sin contenido sexual.**
4. **Extremo**: lo más bestia. Traiciones, verdades incómodas entre el grupo, retos con el móvil que dan miedo. **Sin contenido sexual.**
5. **Sin filtro**: sexo y ligoteo, insinuante pero nunca explícito. La app pide que todo el grupo esté de acuerdo antes de activarlo.

## Regla de contenido

El script mete una u otra en el prompt según el nivel. Lo de "insinuante, no explícito" es lo que aceptan
Apple y Google con clasificación +18; lo explícito o pornográfico hace que rechacen la app.

### niveles-1-4
- NADA de contenido sexual ni desnudos. Lo "picante" es emocional y social, no sexual.

### nivel-5
- NIVEL MÁXIMO, +18 y para gente que ha aceptado jugarlo: tiene que dar vergüenza de verdad y hacer gritar al grupo.
  Si una carta la podría haber escrito una tía en una cena familiar, es demasiado floja: descártala.
- Tema: sexo sin rodeos. Experiencias, fantasías, gustos y manías en la cama, sitios, frecuencia, la primera vez,
  rollos de una noche, ex, apps de ligar, mensajes y fotos subidas de tono, y sobre todo tensión DENTRO del grupo
  (quién te pone, con quién lo harías, quién crees que es mejor en la cama).
- Se puede hablar de sexo con palabras normales ("sexo", "follar", "en la cama", "ponerse cachondo/a", "juguetes").
  Lo que NO: describir actos o partes del cuerpo con detalle, lenguaje porno o vulgar gratuito.
- Retos atrevidos pero sin desnudos: besos (en la boca solo "si acepta"), bailes pegados, sentarse encima, chupitos
  en el cuello u ombligo "si se deja", susurrar algo guarro al oído, enseñar mensajes o búsquedas del móvil.
  Con contacto, SIEMPRE "si acepta"/"a quien quiera": que se pueda decir que no sin pasar nada.
- Ropa: como mucho quitarse prendas normales (camiseta, sudadera, calcetines...). Nunca quedarse en ropa interior.
- Nada de mandar fotos o mensajes íntimos a gente de fuera, nada con menores, sin consentimiento o con desconocidos.
- Sin presuponer orientación: "la persona que te gusta", "con quien", nunca "chica/chico" por defecto.
- Este es el NIVEL DE PICANTE que buscamos (no copies las ideas):
  - ¿Con quién de aquí harías un trío? Tienes que decir los dos nombres.
  - ¿Cuál es la fantasía que nunca te has atrevido a pedir en la cama?
  - Yo nunca he follado en un sitio donde podían pillarme.
  - ¿Quién es más probable que tenga un juguete escondido en la mesita?
  - Dale un beso en el cuello a quien quieras. Si se deja, claro.
  - Susúrrale a {otro} lo que le harías si estuvierais solos. El grupo le pregunta qué tal.

## Prompt base

No hace falta copiarlo a mano: `npm run prompt -- <tipo> <nivel>` lo rellena y lo copia al portapapeles.
Lo que va entre `<...>` lo pone el script: las notas del tipo (sección siguiente), ejemplos buenos
del mismo tipo y nivel sacados del juego, y la lista de cartas que ya existen.

```text
IMPORTANTE: olvida cualquier carta o lista anterior de esta conversación. Empieza desde cero.

Eres guionista de un juego de fiesta para beber en grupo llamado "Padentro", para gente
de 18 a 30 años de España. Escribe <N> cartas nuevas del tipo "<TIPO>" para el nivel <NIVEL>.

OBJETIVO: que el grupo se ría, se pique y diga "¡¿en serio?!". No que acabe peleado ni deprimido.
Incluso en el nivel más alto, comprometido pero con gracia.

NIVELES
1 Suave: rompehielos, apto para gente que acaba de conocerse.
2 Fiesta: anécdotas de fiesta, ligar, vergüenza, redes sociales, resacas.
3 Picante: íntimo y comprometido (ex, crushes, celos, secretos, inseguridades, lo que piensas del grupo).
4 Extremo: lo más bestia; verdades incómodas, cotilleos, retos con el móvil que dan miedo.
5 Sin filtro: sexo sin rodeos y tensión entre el grupo; atrevido de verdad, pero sin describir nada explícito.

TIPO "<TIPO>"
<NOTAS_TIPO>

TEMA DE ESTA TANDA: <TEMA>
Todas las cartas tienen que ir de este tema, cada una sobre una situación distinta dentro de él.
Es para que salgan ideas nuevas: piensa en momentos concretos que le pasan a la gente de 18–30 años con este tema.

ASÍ SÍ (cartas buenas que ya están en el juego; copia el estilo, no las ideas):
<EJEMPLOS>

ASÍ NO (errores de tandas anteriores):
- "¿A quién de aquí le has restado importancia a sus logros?" → fórmula repetida y deprimente.
- "Confiesa si has guardado rencor a alguien de aquí." → es una pregunta disfrazada de reto.
- 50 cartas seguidas sobre "este grupo" → aburre. Mezcla temas.
- Reescribir la misma idea cambiando el principio ("Confiesa…", "Revela…", "Yo nunca he…").

REGLAS
- Español de España, tono coloquial y gracioso, como hablaría un grupo de amigos de 20 años.
<REGLA_CONTENIDO>
- Nada ilegal, peligroso, humillante por físico/raza/orientación ni que obligue a gastar dinero.
- No fomentes beber en exceso: como mucho "bebe X tragos" (máximo 5). Nunca "bébete el vaso entero" ni chupitos de golpe.
- Para mandar beber usa SIEMPRE estas formas exactas: "bebe", "bebes", "beben", "bebe N tragos", "bebe un trago" o "reparte N tragos".
- "alcohol": true SOLO si la carta no tiene sentido sin beber (brindis, cascada, beber con una mano...). Una carta que solo dice "bebe/beben/reparte N tragos" NO lo lleva: la app ya la convierte en penitencia. Normalmente lo llevan 1 o 2 cartas de cada 30, no más.
- Inclusivo en género: "o/a" (ej. "enamorado/a", "el/la más falso/a") o formas neutras.
- Máximo 140 caracteres por carta.
- Puedes usar {jugador} (quien tiene el turno) y {otro} (otro jugador al azar). No inventes más variables.
- Ninguna fórmula puede aparecer más de 3 veces. Dentro del tema, cada carta una situación distinta.
- Como mucho un tercio de las cartas sobre "este grupo"; el resto, sobre la vida de cada uno.
- Cada carta es una idea nueva: no reutilices preguntas de otros tipos de carta.
- No repitas ninguna de estas cartas que ya existen:
<EXISTENTES>
- Tampoco repitas las IDEAS de estas cartas de otros tipos del mismo nivel (salen juntas en la partida):
<OTROS_TIPOS>

Antes de responder, revisa tu lista y cambia las que incumplan alguna regla.

FORMATO DE SALIDA
Solo un array JSON válido, sin texto antes ni después. Dentro de los textos usa comillas simples ('así'), nunca comillas dobles:
[{"level": <NIVEL>, "text": "..."}, {"level": <NIVEL>, "text": "...", "alcohol": true}, ...]
```

## Notas por tipo

### verdad
Una pregunta a quien tiene el turno que se contesta contando una anécdota (menos de 1 minuto).
Evita las de "sí/no" a secas: añade "¿con quién?", "¿por qué?" o "cuenta cuándo".

### reto
Una ACCIÓN que hace quien tiene el turno, en menos de 2 minutos, en una casa o en un bar. Ideas: el móvil
(galería, chats, stories, llamadas, búsquedas, notificaciones), imitar o actuar, cantar o bailar, algo con {otro}.
Empieza por un verbo: "Haz…", "Enseña…", "Llama…", "Deja que…". NUNCA "Confiesa", "Revela" ni "Cuenta": eso son verdades.

### yo-nunca
Empieza por "Yo nunca he…" o "Yo nunca me he…". Una situación concreta que hayan vivido más o menos la MITAD
de la gente de 18–30 años: si lo ha hecho todo el mundo o nadie, la carta no funciona. Mejor anécdotas
que juicios morales ("Yo nunca he hablado mal de alguien de aquí" lo ha hecho todo el mundo y da mal rollo).

### mas-probable
Empieza por "¿Quién es más probable que…?". Predicciones o rasgos que hagan reír al señalar a alguien.
Nada de acusaciones graves ("¿Quién es más probable que sea manipulador?"); en nivel 4 pueden ser comprometidas, pero con gracia.

### todos
Una orden para todo el grupo: "Todos los que… beben", "El último en… bebe 2 tragos", categorías rápidas,
votaciones ("Todos señalan a…"). Se resuelve en menos de 1 minuto.
Mezcla formatos: como mucho 5 de cada uno ("Todos los que…", "El último en…", "Todos señalan…", "El primero en…").
Los "Todos los que…" tienen que cumplirlos más o menos la mitad del grupo (no "los que sepan nadar").

### duelo
Empieza por "{jugador} contra {otro}:". Una competición de menos de 30 segundos con ganador claro
(o que decida el grupo votando). El perdedor bebe; no hace falta decirlo en la carta.

### regla
Una norma que dura hasta que salga otra. Tiene que ser fácil de recordar y fácil de pillar a quien la incumple.
Como mucho 4 de "Prohibido decir 'X'": mezcla con gestos, formas de hablar, roles para {jugador} y normas sobre el móvil.
Puede usar {jugador} ("{jugador} es el/la rey/reina: …").

## Flujo recomendado

1. `npm run prompt -- reto 3 [cantidad] [tema]` copia al portapapeles el prompt completo, con las cartas que ya existen.
   Si no le das tema, elige uno al azar: con tema Grok repite mucho menos.
   Pégalo en Grok en un **chat nuevo**, porque en un chat largo Grok se olvida de las reglas.
2. `npm run import -- verdad grok/verdad-3.json`
3. Léete las cartas en el JSON y borra las que no te gusten. Ninguna IA acierta siempre.
4. `npm run validate`
5. Pruébalas jugando (`npm run dev`).

## Objetivo de contenido para el lanzamiento

| Tipo                                        | Por nivel | Total aprox. |
| ------------------------------------------- | --------- | ------------ |
| verdad, reto, yo-nunca, mas-probable        | 80 en niveles 1–2, 60 en 3–5 | 340 cada uno |
| todos, duelo, regla                         | 40 en niveles 1–2, 30 en 3–5 | 170 cada uno |

Unas 2.000 cartas. Una partida son 40–60 cartas, y Yo nunca y Más probable usan un solo tipo:
con menos de 80 por nivel, un grupo ve repetidas en la segunda o tercera partida.
