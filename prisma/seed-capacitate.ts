/**
 * Seed de CAPACITATE — contenido de las capacitaciones laborales.
 *
 * Cómo correr:
 *   npx ts-node --project tsconfig.json prisma/seed-capacitate.ts
 *
 * O desde Supabase SQL Editor ejecutar el archivo SQL equivalente generado.
 *
 * Para agregar una nueva capacitación:
 *   1. Agregar un objeto a CAPACITACIONES con sus módulos.
 *   2. Correr el seed de nuevo (hace upsert por slug).
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoModulo = 'lectura' | 'pregunta' | 'situacion' | 'actividad' | 'desafio_final';

interface ModuloSeed {
  titulo:          string;
  tipo:            TipoModulo;
  es_desafio_final?: boolean;
  contenido:       Record<string, unknown>;
}

interface CapacitacionSeed {
  slug:         string;
  titulo:       string;
  categoria:    'fisicos_oficios' | 'digitales';
  descripcion:  string;
  nivel:        string;
  duracion_min: number;
  objetivo:     string;
  competencias: string[];
  icono:        string;
  orden:        number;
  modulos:      ModuloSeed[];
}

// ─── CAPACITACIONES ───────────────────────────────────────────────────────────

const CAPACITACIONES: CapacitacionSeed[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // 01 — CASA DE COMIDAS
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'casa-de-comidas',
    titulo:       'Casa de Comidas',
    categoria:    'fisicos_oficios',
    descripcion:  'Aprendé los conocimientos y hábitos fundamentales para trabajar en una casa de comidas: higiene, manipulación de alimentos, seguridad, atención y trabajo en equipo.',
    nivel:        'inicial',
    duracion_min: 45,
    objetivo:     'Prepararte para trabajar en una casa de comidas incorporando conocimientos y hábitos fundamentales de higiene, manipulación de alimentos, seguridad, organización, atención al cliente y trabajo en equipo.',
    competencias: [
      'Higiene y buenas prácticas',
      'Manipulación responsable de alimentos',
      'Seguridad laboral',
      'Preparación y despacho',
      'Atención al cliente',
      'Trabajo en equipo',
      'Organización y ritmo de trabajo',
    ],
    icono:  '🍽️',
    orden:  1,
    modulos: [
      // ── Módulo 1: Conocer el trabajo ──────────────────────────────────────
      {
        titulo: 'Conocer el trabajo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Trabajar en una casa de comidas no significa solamente preparar alimentos. El funcionamiento depende de que distintas personas puedan realizar sus tareas de manera coordinada.

Según el puesto, podés participar en preparación, cocina, armado de pedidos, despacho, atención al cliente, caja, limpieza, reposición y recepción de mercadería.

Cada tarea forma parte de un mismo objetivo: que el cliente reciba lo que pidió, en buenas condiciones y en el tiempo esperado.`,
          pregunta: 'Es tu primer día y tu encargado te dice: "Acá todos tenemos que dar una mano." ¿Qué significa?',
          opciones: [
            'Que cualquiera puede hacer cualquier tarea sin preguntar.',
            'Colaborar cuando sea necesario, respetando las tareas y responsabilidades.',
            'Que solamente importa terminar rápido.',
            'Que no existen responsabilidades individuales.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Bien! Colaborar no significa hacer cualquier cosa. Significa trabajar coordinadamente, respetar las responsabilidades y ayudar cuando corresponde.',
          feedback_incorrecto: 'Todavía no. Colaborar no significa hacer cualquier cosa. Significa trabajar coordinadamente, respetar las responsabilidades y ayudar cuando corresponde.',
          competencia: 'Trabajo en equipo',
        },
      },
      // ── Módulo 2: Higiene personal ────────────────────────────────────────
      {
        titulo: 'Higiene personal',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Cuando trabajás con alimentos, tu higiene forma parte de la seguridad del producto.

Las manos deben lavarse correctamente antes de comenzar a trabajar, después de ir al baño, después de manipular residuos, después de tocar elementos sucios, después de tocarse la cara o el cabello, y antes de manipular alimentos listos para consumir.

También hay que prestar atención a las uñas, la ropa de trabajo, el cabello y las heridas.`,
          pregunta: 'Estabas armando un pedido. Te piden que saques una bolsa de residuos. Volvés y tenés que continuar armando el pedido. ¿Qué hacés?',
          opciones: [
            'Te ponés guantes directamente.',
            'Continuás porque solamente tocaste una bolsa.',
            'Te limpiás las manos con la ropa.',
            'Te lavás correctamente las manos antes de volver a manipular alimentos.',
          ],
          respuesta_correcta: 3,
          feedback_correcto:  '¡Correcto! Los guantes no reemplazan el lavado de manos. La higiene debe mantenerse durante toda la jornada.',
          feedback_incorrecto: 'Todavía no. Los guantes no reemplazan el lavado de manos. La higiene debe mantenerse durante toda la jornada.',
          competencia: 'Higiene y buenas prácticas',
        },
      },
      // ── Módulo 3: Manipulación segura de alimentos ────────────────────────
      {
        titulo: 'Manipulación segura de alimentos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Trabajar con alimentos requiere evitar situaciones que puedan contaminarlos. Hay que prestar atención a la higiene de manos, limpieza de superficies, utensilios, almacenamiento y separación de alimentos.

Una situación importante es la contaminación cruzada: cuando microorganismos o sustancias pasan de un alimento, superficie o utensilio a otro. Es uno de los riesgos más frecuentes y hay que conocerlo bien.`,
          pregunta: 'Utilizaste un utensilio con un alimento crudo y ahora necesitás utilizarlo con un alimento listo para consumir. ¿Qué hacés?',
          opciones: [
            'Lo limpiás y sanitizás según el procedimiento antes de volver a utilizarlo.',
            'Lo utilizás directamente porque estuvo poco tiempo en contacto.',
            'Lo limpiás con la ropa.',
            'Lo utilizás solamente si el alimento parece limpio.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:  '¡Muy bien! Evitar la contaminación cruzada es una responsabilidad fundamental al manipular alimentos.',
          feedback_incorrecto: 'Todavía no. Evitar la contaminación cruzada es fundamental. El utensilio debe limpiarse y sanitizarse correctamente antes de usarlo de nuevo.',
          competencia: 'Manipulación responsable de alimentos',
        },
      },
      // ── Módulo 4: Orden y limpieza ────────────────────────────────────────
      {
        titulo: 'Orden y limpieza',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Una zona de trabajo limpia y ordenada permite trabajar mejor y reducir riesgos. Durante la jornada hay que mantener superficies limpias, utensilios organizados, residuos correctamente descartados, pisos despejados y productos almacenados correctamente.

Los elementos de limpieza deben mantenerse separados de los alimentos.`,
          pregunta: 'Terminaste una tarea y dejaste una caja en medio del paso porque pensás acomodarla después. ¿Qué problema puede generar?',
          opciones: [
            'Solamente afecta la estética del lugar.',
            'Puede provocar tropiezos, accidentes y dificultar la circulación.',
            'Ninguno si la caja está vacía.',
            'Es responsabilidad de otra persona.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Correcto! Mantener el espacio ordenado es parte del trabajo y también una medida de seguridad.',
          feedback_incorrecto: 'Todavía no. Una caja en el paso puede provocar tropiezos y accidentes. Mantener el espacio ordenado es parte del trabajo.',
          competencia: 'Organización y ritmo de trabajo',
        },
      },
      // ── Módulo 5: Seguridad en el trabajo ────────────────────────────────
      {
        titulo: 'Seguridad en el trabajo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `En una casa de comidas pueden existir diferentes riesgos: superficies calientes, elementos cortantes, pisos mojados, equipos eléctricos, objetos pesados y productos de limpieza.

La regla fundamental es: no improvisar cuando existe un riesgo. Si no sabés utilizar un equipo o realizar una tarea, tenés que pedir indicaciones antes de empezar.`,
          pregunta: 'Nunca utilizaste una máquina y un compañero te dice: "Dale, usala. Es fácil." ¿Qué hacés?',
          opciones: [
            'La probás para aprender.',
            'La usás rápidamente porque hay mucho trabajo.',
            'Pedís que te expliquen cómo utilizarla correctamente y seguís el procedimiento.',
            'Mirás cómo funciona mientras la utilizás.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:  '¡Bien! La seguridad está por encima de la velocidad. Preguntar antes de utilizar un equipo desconocido es una conducta profesional.',
          feedback_incorrecto: 'Todavía no. La seguridad está por encima de la velocidad. Nunca uses un equipo que no conocés sin pedir instrucciones primero.',
          competencia: 'Seguridad laboral',
        },
      },
      // ── Módulo 6: Armado y entrega de pedidos ────────────────────────────
      {
        titulo: 'Armado y entrega de pedidos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Un pedido debe entregarse correctamente. Antes de hacerlo conviene verificar el producto, la cantidad, adicionales, bebidas, acompañamientos, presentación e identificación del pedido.

Un error aparentemente pequeño puede generar una devolución o un reclamo. Tomarte un momento para verificar evita problemas innecesarios.`,
          pregunta: 'Tenés dos pedidos preparados y no estás seguro de cuál corresponde al cliente que está esperando. ¿Qué hacés?',
          opciones: [
            'Elegís el que parezca más parecido.',
            'Entregás cualquiera para avanzar.',
            'Preguntás a otro cliente.',
            'Verificás la identificación antes de entregar.',
          ],
          respuesta_correcta: 3,
          feedback_correcto:  '¡Muy bien! Verificar antes de entregar evita errores innecesarios y demuestra atención al detalle.',
          feedback_incorrecto: 'Todavía no. Verificar la identificación del pedido evita errores y demuestra profesionalismo. Tomarte ese segundo extra marca la diferencia.',
          competencia: 'Preparación y despacho',
        },
      },
      // ── Módulo 7: Atención al cliente ─────────────────────────────────────
      {
        titulo: 'Atención al cliente',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Aunque tu tarea principal no sea atender al público, podés tener contacto con clientes. Una buena atención implica: escuchar → comprender → responder → resolver o derivar.

No siempre vas a poder resolver personalmente un problema. En ese caso, la respuesta correcta es recurrir al responsable correspondiente, no inventar una solución.`,
          pregunta: 'Un cliente reclama porque recibió un producto diferente al que había pedido. ¿Qué respuesta es más profesional?',
          opciones: [
            '"No es mi problema."',
            '"Entiendo el problema. Voy a verificar el pedido y consultar cómo podemos solucionarlo."',
            '"Seguro usted pidió eso."',
            '"Tiene que esperar."',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Correcto! No se trata solamente de ser amable. Una buena atención implica escuchar, verificar y buscar una solución.',
          feedback_incorrecto: 'Todavía no. Una buena atención implica escuchar, verificar y buscar una solución, no ignorar ni justificar el problema.',
          competencia: 'Atención al cliente',
        },
      },
      // ── Módulo 8: Trabajo en equipo ───────────────────────────────────────
      {
        titulo: 'Trabajo en equipo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `En una casa de comidas, las tareas están conectadas. Un retraso en cocina puede afectar al despacho. Un problema en despacho puede afectar al cliente.

Por eso es importante comunicar problemas, respetar indicaciones, avisar cuando una tarea está terminada, pedir ayuda cuando es necesario y mantener una buena comunicación con el equipo.`,
          pregunta: 'Terminaste tu tarea y ves que un compañero está sobrepasado durante un momento de mucha demanda. ¿Qué hacés?',
          opciones: [
            'Preguntás si necesita ayuda y colaborás si corresponde.',
            'Te vas porque ya terminaste.',
            'Le decís que se apure.',
            'Esperás a que otra persona intervenga.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:  '¡Muy bien! Trabajar en equipo significa entender que el resultado depende de varias personas.',
          feedback_incorrecto: 'Todavía no. Trabajar en equipo significa entender que el resultado depende de varias personas. Ofrecer ayuda cuando podés es parte del trabajo.',
          competencia: 'Trabajo en equipo',
        },
      },
      // ── Módulo 9: Ritmo de trabajo ────────────────────────────────────────
      {
        titulo: 'Ritmo de trabajo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `En determinados momentos pueden entrar muchos pedidos al mismo tiempo. Es importante trabajar con ritmo, pero rápido no significa hacerlo de cualquier manera.

Hay que mantener el equilibrio entre velocidad + orden + calidad + seguridad. Si la presión te hace cometer errores, es momento de reorganizarte y pedir ayuda.`,
          pregunta: 'Hay muchos pedidos y empezás a cometer errores. ¿Qué conviene hacer?',
          opciones: [
            'Dejar de verificar los pedidos para ganar tiempo.',
            'Entregar productos incompletos y corregir después.',
            'Hacer todo cada vez más rápido.',
            'Organizar las prioridades, mantener el procedimiento y pedir ayuda si es necesario.',
          ],
          respuesta_correcta: 3,
          feedback_correcto:  '¡Bien! La presión del momento no debe llevarte a abandonar los procedimientos básicos.',
          feedback_incorrecto: 'Todavía no. Cuando hay presión, lo mejor es organizarte, mantener el procedimiento y pedir ayuda. Acelerar sin control genera más errores.',
          competencia: 'Organización y ritmo de trabajo',
        },
      },
      // ── Módulo 10: Aprender en el trabajo ────────────────────────────────
      {
        titulo: 'Aprender en el trabajo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `En tu primer trabajo no vas a saber todo. Y eso está bien. Una persona que aprende rápido pregunta, escucha, observa, acepta correcciones, toma nota y practica.

Las correcciones no son ataques. Son oportunidades para mejorar. Las personas que incorporan el aprendizaje más rápido son las que más valoran sus supervisores.`,
          pregunta: 'Tu encargado te corrige una tarea que realizaste mal. ¿Qué hacés?',
          opciones: [
            'Decís que nadie te había explicado.',
            'Seguís haciéndolo igual.',
            'Escuchás la corrección, preguntás si tenés dudas y tratás de hacerlo correctamente la próxima vez.',
            'Te molestás porque ya habías aprendido.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:  '¡Muy bien! Aprender de las correcciones es una de las habilidades más importantes cuando empezás un trabajo.',
          feedback_incorrecto: 'Todavía no. Las correcciones no son ataques: son oportunidades para mejorar. Escuchar y ajustar es una de las habilidades más valoradas.',
          competencia: 'Organización y ritmo de trabajo',
        },
      },
      // ── Desafío final ─────────────────────────────────────────────────────
      {
        titulo:          'Tu primer turno',
        tipo:            'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer día en la casa de comidas. El encargado te presentó al equipo y te explicó tus tareas básicas. Durante el turno van a aparecer situaciones que necesitás resolver.',
          puntaje_aprobacion: 80,
          competencias_criticas: ['Higiene y buenas prácticas', 'Seguridad laboral'],
          tareas: [
            {
              titulo:      'Situación de higiene',
              descripcion: 'Estás trabajando con alimentos y acabás de manipular residuos. ¿Qué hacés antes de continuar?',
              tipo:        'multiple_choice',
              opciones:    [
                'Continuás trabajando porque fue rápido.',
                'Te limpiás las manos en la ropa.',
                'Te ponés guantes y continuás.',
                'Te lavás las manos correctamente antes de volver a manipular alimentos.',
              ],
              respuesta_correcta: 3,
              competencia: 'Higiene y buenas prácticas',
              peso:        15,
            },
            {
              titulo:      'Contaminación cruzada',
              descripcion: 'Usaste un utensilio con pollo crudo. Ahora tenés que usarlo para servir ensalada lista para consumir.',
              tipo:        'multiple_choice',
              opciones:    [
                'Lo enjuagás rápido con agua.',
                'Lo limpiás y sanitizás correctamente según el procedimiento.',
                'Lo usás porque el tiempo de contacto fue corto.',
                'Lo limpiás con papel.',
              ],
              respuesta_correcta: 1,
              competencia: 'Manipulación responsable de alimentos',
              peso:        15,
            },
            {
              titulo:      'Seguridad con equipos',
              descripcion: 'Te piden que uses una máquina que nunca operaste. Un compañero te dice que es fácil.',
              tipo:        'multiple_choice',
              opciones:    [
                'La usás para no quedar mal.',
                'La mirás un momento y empezás.',
                'Pedís que te expliquen el procedimiento correcto antes de empezar.',
                'La usás despacio para no cometer errores.',
              ],
              respuesta_correcta: 2,
              competencia: 'Seguridad laboral',
              peso:        10,
            },
            {
              titulo:      'Verificación de pedidos',
              descripcion: 'Tenés dos pedidos listos y no estás seguro cuál es de quién.',
              tipo:        'multiple_choice',
              opciones:    [
                'Entregás el que parece más probable.',
                'Los entregás juntos para que cada uno tome el suyo.',
                'Preguntás a un compañero para que decida.',
                'Verificás la identificación de cada pedido antes de entregar.',
              ],
              respuesta_correcta: 3,
              competencia: 'Preparación y despacho',
              peso:        10,
            },
            {
              titulo:      'Reclamo de cliente',
              descripcion: 'Un cliente dice que recibió un producto incompleto y está molesto.',
              tipo:        'multiple_choice',
              opciones:    [
                '"Debe haber un error suyo."',
                '"Entiendo. Voy a verificar su pedido y consulto cómo solucionarlo."',
                '"Eso no es posible."',
                '"Tiene que esperar."',
              ],
              respuesta_correcta: 1,
              competencia: 'Atención al cliente',
              peso:        10,
            },
            {
              titulo:      'Trabajo en equipo bajo presión',
              descripcion: 'Terminaste tu tarea y un compañero no puede con todo en el momento de mayor demanda.',
              tipo:        'multiple_choice',
              opciones:    [
                'Esperás a que alguien más lo ayude.',
                'Le avisás al encargado que hay un problema.',
                'Preguntás si necesita ayuda y colaborás.',
                'Te vas a descansar porque ya terminaste.',
              ],
              respuesta_correcta: 2,
              competencia: 'Trabajo en equipo',
              peso:        10,
            },
            {
              titulo:      'Presión y errores',
              descripcion: 'Hay muchos pedidos y empezás a cometer equivocaciones.',
              tipo:        'multiple_choice',
              opciones:    [
                'Acelerás para recuperar el tiempo.',
                'Seguís igual hasta que pase el pico.',
                'Parás y reorganizás. Pedís ayuda si es necesario.',
                'Dejás de verificar para ir más rápido.',
              ],
              respuesta_correcta: 2,
              competencia: 'Organización y ritmo de trabajo',
              peso:        10,
            },
            {
              titulo:      'Corrección del encargado',
              descripcion: 'El encargado te observa y te dice que hiciste algo de forma incorrecta.',
              tipo:        'multiple_choice',
              opciones:    [
                'Explicás que nadie te había indicado otra cosa.',
                'Escuchás, preguntás si tenés dudas y ajustás tu forma de trabajar.',
                'Seguís como venías porque te parece que estaba bien.',
                'Te molestás porque considera que estabas trabajando mal.',
              ],
              respuesta_correcta: 1,
              competencia: 'Organización y ritmo de trabajo',
              peso:        10,
            },
          ],
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 02 — ATENCIÓN AL CLIENTE
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'atencion-al-cliente',
    titulo:       'Atención al Cliente',
    categoria:    'fisicos_oficios',
    descripcion:  'Aprendé a escuchar, comunicarte con claridad, resolver situaciones y mantener una actitud profesional en trabajos con contacto directo con el público.',
    nivel:        'inicial',
    duracion_min: 45,
    objetivo:     'Prepararte para trabajar en puestos donde tengas contacto directo con clientes: aprender a escuchar, comunicarte con claridad, comprender necesidades, resolver situaciones, manejar reclamos y mantener una actitud profesional.',
    competencias: [
      'Atención al cliente',
      'Escucha activa',
      'Comunicación clara',
      'Empatía',
      'Resolución de problemas',
      'Manejo de reclamos',
      'Derivación',
      'Profesionalismo',
      'Trabajo bajo presión',
    ],
    icono:  '🤝',
    orden:  2,
    modulos: [
      // ── Módulo 1 ─────────────────────────────────────────────────────────
      {
        titulo: '¿Qué significa atender bien?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Atender bien no significa solamente ser amable. Una buena atención implica: recibir → escuchar → comprender → responder → resolver o derivar.

El cliente necesita sentir que su consulta fue escuchada y que alguien se está ocupando de su situación. Eso marca la diferencia entre una experiencia positiva y una negativa.`,
          pregunta: 'Un cliente entra al local y pregunta dónde puede encontrar un producto. ¿Qué hacés?',
          opciones: [
            'Le indicás rápidamente dónde está y continuás con tu tarea.',
            'Le decís que busque en el local.',
            'Lo escuchás, le indicás dónde encontrarlo y, si es necesario, lo acompañás.',
            'Le decís que espere hasta que termines todo lo que estás haciendo.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:  '¡Muy bien! Una buena atención implica prestar atención y facilitarle al cliente la solución.',
          feedback_incorrecto: 'Todavía no. Una buena atención implica prestar atención y facilitar la solución. No alcanza con señalar; hay que acompañar.',
          competencia: 'Atención al cliente',
        },
      },
      // ── Módulo 2 ─────────────────────────────────────────────────────────
      {
        titulo: 'La primera impresión',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `La atención comienza antes de resolver una consulta. El saludo, la mirada, el tono de voz y la disposición para ayudar forman parte de la experiencia del cliente.

Una frase sencilla como "Hola, ¿cómo estás? ¿En qué puedo ayudarte?" puede marcar la diferencia entre un cliente que se va conforme y uno que no vuelve.`,
          pregunta: 'Estás realizando una tarea y entra un cliente. En ese momento no podés atenderlo inmediatamente. ¿Qué sería más profesional?',
          opciones: [
            'Seguir trabajando hasta terminar sin decir nada.',
            'Reconocer su presencia y decirle que en un momento lo vas a atender.',
            'Señalarle que espere.',
            'Pedirle que vuelva más tarde.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Correcto! Aunque tengas que esperar unos minutos, reconocer al cliente demuestra atención y respeto.',
          feedback_incorrecto: 'Todavía no. Ignorar la presencia de un cliente —aunque estés ocupado— genera una mala primera impresión. Basta con reconocerlo brevemente.',
          competencia: 'Atención al cliente',
        },
      },
      // ── Módulo 3 ─────────────────────────────────────────────────────────
      {
        titulo: 'Escuchar antes de responder',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Muchas veces el error no está en la respuesta, sino en responder antes de entender la pregunta. Escuchar significa prestar atención y, cuando sea necesario, hacer preguntas para comprender mejor.

Antes de dar una respuesta, asegurate de entender exactamente qué necesita la persona. Una pregunta a tiempo evita una respuesta equivocada.`,
          pregunta: 'Un cliente explica un problema, pero no terminás de entender qué ocurrió. ¿Qué hacés?',
          opciones: [
            'Le das una respuesta aproximada.',
            'Le decís que vuelva cuando tenga más información.',
            'Le pedís a un compañero que responda sin explicarle nada.',
            'Hacés una pregunta para aclarar la situación antes de responder.',
          ],
          respuesta_correcta: 3,
          feedback_correcto:  '¡Muy bien! Una pregunta a tiempo puede evitar una respuesta incorrecta y resolver mejor el problema.',
          feedback_incorrecto: 'Todavía no. Preguntar para entender mejor es señal de profesionalismo. Dar una respuesta aproximada puede generar un problema mayor.',
          competencia: 'Escucha activa',
        },
      },
      // ── Módulo 4 ─────────────────────────────────────────────────────────
      {
        titulo: 'Comunicación clara',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Una respuesta profesional debe ser: clara + concreta + respetuosa. No hace falta utilizar palabras complicadas.

También es importante no prometer algo que no sabemos si podemos cumplir. Si no conocés la respuesta, lo más profesional es decirlo y buscar la información correcta.`,
          pregunta: 'Un cliente te pregunta algo y no conocés la respuesta. ¿Cuál es la mejor opción?',
          opciones: [
            'Decirle que vas a verificar la información antes de responder.',
            'Darle una respuesta aproximada para no hacerlo esperar.',
            'Inventar una respuesta que parezca correcta.',
            'Decirle que no sabés y terminar la atención.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:  '¡Bien! Reconocer que necesitás verificar una información es mucho más profesional que inventar una respuesta.',
          feedback_incorrecto: 'Todavía no. Reconocer que necesitás verificar es profesional. Inventar una respuesta puede generar un problema mayor después.',
          competencia: 'Comunicación clara',
        },
      },
      // ── Módulo 5 ─────────────────────────────────────────────────────────
      {
        titulo: 'Clientes molestos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Un cliente enojado puede hablar con un tono fuerte. Tu responsabilidad es mantener la calma y evitar que la situación escale.

Una secuencia útil es: escuchar → mantener la calma → comprender → verificar → resolver o derivar.

Responder con el mismo tono empeora la situación. Mantener la calma no significa aceptar todo: significa no perder la profesionalidad.`,
          pregunta: 'Un cliente llega muy molesto y empieza a reclamar. ¿Qué hacés?',
          opciones: [
            'Le explicás inmediatamente por qué está equivocado.',
            'Le pedís que se calme antes de escucharlo.',
            'Lo escuchás, mantenés la calma y tratás de entender qué ocurrió.',
            'Respondés utilizando el mismo tono.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:  '¡Correcto! No necesitás estar de acuerdo con el cliente para escucharlo y tratar la situación profesionalmente.',
          feedback_incorrecto: 'Todavía no. Escuchar, mantener la calma y entender qué ocurrió es el primer paso. Responder a la defensiva o con el mismo tono escala el conflicto.',
          competencia: 'Manejo de reclamos',
        },
      },
      // ── Módulo 6 ─────────────────────────────────────────────────────────
      {
        titulo: 'Resolver o derivar',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `No siempre vas a tener autorización o herramientas para resolver un problema. Saber cuándo pedir ayuda es parte de trabajar bien.

Derivar no es esquivar la responsabilidad: es asegurarse de que el problema llegue a quien puede resolverlo correctamente.`,
          pregunta: 'Un cliente solicita una devolución que vos no estás autorizado a realizar. ¿Qué hacés?',
          opciones: [
            'Le prometés que vas a realizarla igual.',
            'Le explicás que vas a consultar al responsable correspondiente.',
            'Le decís directamente que no se puede.',
            'Le pedís que vuelva otro día.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Bien! No hay que inventar soluciones ni asumir responsabilidades que no corresponden. Hay que derivar correctamente.',
          feedback_incorrecto: 'Todavía no. Prometer algo que no podés hacer genera un problema mayor. Consultar al responsable es la respuesta correcta.',
          competencia: 'Derivación',
        },
      },
      // ── Módulo 7 ─────────────────────────────────────────────────────────
      {
        titulo: 'Empatía',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `La empatía consiste en intentar comprender cómo está viviendo la situación la otra persona. No significa darle la razón en todo. Significa reconocer lo que está pasando y responder de manera respetuosa.

Un cliente que espera, que tuvo un problema o que está frustrado necesita sentir que lo entendés, no solo que le respondés.`,
          pregunta: 'Un cliente tuvo que esperar más tiempo de lo previsto. ¿Qué respuesta demuestra mejor empatía?',
          opciones: [
            '"Todos están esperando."',
            '"No es culpa mía."',
            '"Vas a tener que seguir esperando."',
            '"Entiendo la demora. Voy a verificar en qué estado está tu pedido."',
          ],
          respuesta_correcta: 3,
          feedback_correcto:  '¡Muy bien! Reconocer la situación y actuar para encontrar información o una solución ayuda a desactivar el conflicto.',
          feedback_incorrecto: 'Todavía no. Reconocer lo que está viviendo el cliente y hacer algo para ayudarlo es la clave de la empatía en el trabajo.',
          competencia: 'Empatía',
        },
      },
      // ── Módulo 8 ─────────────────────────────────────────────────────────
      {
        titulo: 'Cuando cometés un error',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Los errores pueden ocurrir. Lo importante es qué hacés cuando descubrís uno.

Una respuesta profesional implica: reconocer → informar → corregir → aprender.

Ocultar un error suele generar un problema más grande. Reconocerlo y buscar cómo corregirlo es la actitud correcta.`,
          pregunta: 'Te das cuenta de que le diste información incorrecta a un cliente. ¿Qué hacés?',
          opciones: [
            'Lo comunicás y buscás corregir la situación.',
            'Esperás que nadie lo note.',
            'Culpás a un compañero.',
            'Seguís adelante para evitar un problema.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:  '¡Correcto! Ocultar un error puede generar un problema mayor. Reconocerlo permite corregirlo.',
          feedback_incorrecto: 'Todavía no. Ocultar un error lo convierte en un problema mayor. Reconocerlo y corregirlo a tiempo es lo profesional.',
          competencia: 'Profesionalismo',
        },
      },
      // ── Módulo 9 ─────────────────────────────────────────────────────────
      {
        titulo: 'Momentos de mucha demanda',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `Hay momentos en los que muchas personas necesitan atención al mismo tiempo. El objetivo no es solamente atender rápido. Hay que mantener: orden + claridad + respeto + calidad.

Atender a todos mal es peor que hacer esperar a algunos con una buena explicación.`,
          pregunta: 'Hay cinco clientes esperando y estás atendiendo a una persona. ¿Qué hacés?',
          opciones: [
            'Terminás correctamente la atención actual y organizás la espera.',
            'Dejás al cliente actual para atender a los demás.',
            'Intentás atender a todos al mismo tiempo.',
            'Ignorás a quienes están esperando.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:  '¡Bien! Organizar la espera permite mantener una atención correcta incluso en momentos de presión.',
          feedback_incorrecto: 'Todavía no. Terminar una atención correctamente y organizar la espera es mejor que intentar atender a todos mal al mismo tiempo.',
          competencia: 'Trabajo bajo presión',
        },
      },
      // ── Módulo 10 ────────────────────────────────────────────────────────
      {
        titulo: 'Profesionalismo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: `La atención al cliente también refleja tus hábitos laborales. Ser profesional implica cumplir horarios, mantener una actitud respetuosa, escuchar, respetar procedimientos, aceptar correcciones, aprender y trabajar en equipo.

El profesionalismo no es algo que tenés o no tenés. Es algo que se construye día a día.`,
          pregunta: 'Tu supervisor observa una situación y te hace una corrección sobre tu forma de atender. ¿Qué hacés?',
          opciones: [
            'Le explicás que siempre lo hiciste así.',
            'Escuchás la observación, preguntás si tenés dudas y tratás de mejorar.',
            'Ignorás la indicación.',
            'Te molestás porque considera que trabajaste mal.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:  '¡Muy bien! Una corrección puede ayudarte a mejorar una habilidad. Escuchar y aprender de ella demuestra profesionalismo.',
          feedback_incorrecto: 'Todavía no. Las correcciones son oportunidades de mejora, no ataques. Escuchar y ajustar es lo profesional.',
          competencia: 'Profesionalismo',
        },
      },
      // ── Desafío final ─────────────────────────────────────────────────────
      {
        titulo:          'Un día de atención',
        tipo:            'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer día en un trabajo de atención al público. Durante la jornada van a aparecer distintas situaciones. Tu objetivo es manejar cada una de manera profesional.',
          puntaje_aprobacion: 80,
          competencias_criticas: ['Manejo de reclamos', 'Profesionalismo'],
          tareas: [
            {
              titulo:      'Cliente que llega mientras estás ocupado',
              descripcion: 'Estás en medio de una tarea y entra un cliente. No podés atenderlo inmediatamente.',
              tipo:        'multiple_choice',
              opciones:    [
                'Seguís trabajando hasta terminar sin decir nada.',
                'Le señalás que espere con un gesto.',
                'Reconocés su presencia y le decís que en un momento lo atendés.',
                'Le pedís que vuelva en unos minutos.',
              ],
              respuesta_correcta: 2,
              competencia: 'Atención al cliente',
              peso:        10,
            },
            {
              titulo:      'No entendiste bien el problema',
              descripcion: 'Un cliente te explica algo, pero no quedó claro qué necesita exactamente.',
              tipo:        'multiple_choice',
              opciones:    [
                'Le das una respuesta aproximada.',
                'Hacés una pregunta para entender mejor antes de responder.',
                'Le pedís que espere y consultás con un compañero.',
                'Le decís que vuelva cuando tenga más información.',
              ],
              respuesta_correcta: 1,
              competencia: 'Escucha activa',
              peso:        10,
            },
            {
              titulo:      'No conocés la respuesta',
              descripcion: 'Un cliente te pregunta algo sobre un producto o servicio que no conocés bien.',
              tipo:        'multiple_choice',
              opciones:    [
                'Inventás una respuesta que suene correcta.',
                'Le decís que preguntás y verificás la información.',
                'Le decís que no sabés y cerrás la atención.',
                'Le respondés con lo que te acordás aproximadamente.',
              ],
              respuesta_correcta: 1,
              competencia: 'Comunicación clara',
              peso:        10,
            },
            {
              titulo:      'Cliente enojado',
              descripcion: 'Un cliente llega frustrado y te habla en un tono elevado.',
              tipo:        'multiple_choice',
              opciones:    [
                'Le respondés con el mismo tono para que entienda la situación.',
                'Le pedís que se calme antes de escucharlo.',
                'Llamás a un compañero para que lo atienda.',
                'Lo escuchás con calma y tratás de entender qué ocurrió.',
              ],
              respuesta_correcta: 3,
              competencia: 'Manejo de reclamos',
              peso:        15,
            },
            {
              titulo:      'Solución que no podés dar',
              descripcion: 'El cliente necesita una devolución, pero vos no tenés autorización para realizarla.',
              tipo:        'multiple_choice',
              opciones:    [
                'Le prometés que se va a realizar igual.',
                'Le explicás que vas a consultar al responsable.',
                'Le decís que no se puede y terminás la atención.',
                'Le pedís que vuelva mañana.',
              ],
              respuesta_correcta: 1,
              competencia: 'Derivación',
              peso:        15,
            },
            {
              titulo:      'Descubrís un error propio',
              descripcion: 'Te das cuenta de que le diste información incorrecta a un cliente que se fue hace unos minutos.',
              tipo:        'multiple_choice',
              opciones:    [
                'Esperás que nadie lo note.',
                'Lo comentás con un compañero para que lo resuelva.',
                'Lo comunicás al responsable y buscás cómo corregirlo.',
                'Seguís adelante para no generar un problema.',
              ],
              respuesta_correcta: 2,
              competencia: 'Profesionalismo',
              peso:        10,
            },
            {
              titulo:      'Muchos clientes esperando',
              descripcion: 'Hay varias personas esperando atención y todavía estás con el cliente actual.',
              tipo:        'multiple_choice',
              opciones:    [
                'Cortás la atención actual para atender a los demás.',
                'Intentás atender a todos al mismo tiempo.',
                'Terminás correctamente la atención y organizás la espera de los demás.',
                'Ignorás a quienes esperan para no perder el hilo.',
              ],
              respuesta_correcta: 2,
              competencia: 'Trabajo bajo presión',
              peso:        10,
            },
            {
              titulo:      'Corrección del supervisor',
              descripcion: 'Tu supervisor te observa y te señala que tu forma de atender puede mejorar.',
              tipo:        'multiple_choice',
              opciones:    [
                'Le explicás que siempre lo hiciste así.',
                'Escuchás, preguntás si tenés dudas y ajustás tu forma de trabajar.',
                'Ignorás la indicación.',
                'Te molestás porque crees que trabajaste bien.',
              ],
              respuesta_correcta: 1,
              competencia: 'Profesionalismo',
              peso:        10,
            },
          ],
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 03 — PLAYERO DE ESTACIÓN DE SERVICIO
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'playero-estacion-servicio',
    titulo:       'Playero de Estación de Servicio',
    categoria:    'fisicos_oficios',
    descripcion:  'Aprendé los procedimientos de atención, seguridad y operación de una estación de servicio.',
    nivel:        'básico',
    duracion_min: 35,
    objetivo:     'Conocer los procedimientos esenciales de una estación de servicio para brindar una atención segura, ordenada y eficiente.',
    competencias: [
      'Atención al cliente',
      'Seguridad laboral',
      'Cumplimiento de procedimientos',
      'Comunicación',
      'Organización',
      'Trabajo en equipo',
      'Manejo de situaciones de demanda',
      'Aprendizaje en el puesto',
    ],
    icono:  '⛽',
    orden:  3,
    modulos: [

      // ── Módulo 1 ─────────────────────────────────────────────────────────
      {
        titulo: 'Recibir al cliente',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La primera impresión es clave en una estación de servicio. Al llegar un vehículo, el playero debe acercarse de inmediato, saludar amablemente y preguntar qué necesita el cliente. Esto genera confianza y demuestra profesionalismo.',
          situacion: 'Un auto entra a la estación. El cliente baja la ventanilla y espera. Vos estás terminando de atender otra bomba.',
          pregunta: '¿Qué hacés primero?',
          opciones: [
            { letra: 'A', texto: 'Ignorás al nuevo cliente hasta terminar completamente con el otro.' },
            { letra: 'B', texto: 'Le pedís al compañero que lo atienda sin avisarle al cliente.' },
            { letra: 'C', texto: 'Levantás la vista, saludás con un gesto y decís "ya te atiendo" para que sepa que lo viste.' },
            { letra: 'D', texto: 'Te acercás corriendo al auto nuevo y dejás al otro cliente sin terminar.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. Reconocer al cliente aunque estés ocupado es parte de la buena atención.',
          feedback_incorrecto: 'Lo importante es que el cliente sepa que lo viste. Un gesto o una palabra breve evita que se sienta ignorado.',
          competencias_criticas: ['Atención al cliente'],
        },
      },

      // ── Módulo 2 ─────────────────────────────────────────────────────────
      {
        titulo: 'Confirmar la carga de combustible',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de cargar combustible, siempre hay que confirmar el tipo y la cantidad con el cliente. Un error en el tipo de combustible (nafta súper, premium, gasoil) puede dañar el motor del vehículo y generar un problema grave.',
          situacion: 'Un cliente te dice: "Llená". No aclara qué combustible ni cuánto.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Abrís la tapa del tanque y cargás lo que te parece.' },
            { letra: 'B', texto: 'Preguntás: "¿Qué combustible y cuánto querés cargar?"' },
            { letra: 'C', texto: 'Cargás nafta súper porque es la más común.' },
            { letra: 'D', texto: 'Esperás a que el cliente aclare por sí solo sin preguntar.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Siempre confirmar. Un error de combustible es un problema serio y costoso.',
          feedback_incorrecto: 'Nunca asumas. Siempre preguntá el tipo y la cantidad antes de cargar.',
          competencias_criticas: ['Cumplimiento de procedimientos', 'Atención al cliente'],
        },
      },

      // ── Módulo 3 ─────────────────────────────────────────────────────────
      {
        titulo: 'Detectar un riesgo de seguridad',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Las estaciones de servicio manejan materiales inflamables. Cualquier fuente de calor, llama o chispa puede provocar un accidente grave. El playero debe estar atento y actuar de inmediato ante situaciones de riesgo.',
          situacion: 'Mientras cargás nafta, el cliente enciende un cigarrillo dentro del auto.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Le pedís amablemente pero con firmeza que apague el cigarrillo.' },
            { letra: 'B', texto: 'No decís nada para no incomodar al cliente.' },
            { letra: 'C', texto: 'Cortás la carga y te alejás sin explicar.' },
            { letra: 'D', texto: 'Avisás al encargado pero seguís cargando.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. La seguridad es prioridad. Siempre se puede ser firme y amable al mismo tiempo.',
          feedback_incorrecto: 'Ante un riesgo de seguridad hay que actuar de inmediato, con firmeza y respeto.',
          competencias_criticas: ['Seguridad laboral'],
        },
      },

      // ── Módulo 4 ─────────────────────────────────────────────────────────
      {
        titulo: 'Mantener el orden en la playa',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Mantener el orden en la playa de la estación es parte del trabajo diario. Los trapos, envases y herramientas deben estar en su lugar para evitar accidentes y dar una buena imagen al local.',
          situacion: 'Terminaste de atender un auto. El trapo con el que limpiaste el parabrisas está tirado en el piso y hay un envase de aceite vacío cerca de la bomba.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Lo dejás para después porque ya viene otro auto.' },
            { letra: 'B', texto: 'Pateás el trapo al costado para que no moleste.' },
            { letra: 'C', texto: 'Juntás el trapo y el envase y los ponés en su lugar antes de atender el próximo auto.' },
            { letra: 'D', texto: 'Le pedís a otro compañero que lo levante.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Mantener el orden es parte de trabajar bien. El desorden puede causar accidentes.',
          feedback_incorrecto: 'El orden no puede esperar. Cada pequeña acción de limpieza previene accidentes y mejora la imagen.',
          competencias_criticas: ['Organización'],
        },
      },

      // ── Módulo 5 ─────────────────────────────────────────────────────────
      {
        titulo: 'Comunicar novedades al compañero',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El trabajo en equipo en una estación de servicio requiere comunicación constante. Si detectás algo que puede afectar al próximo turno o a un compañero, hay que decirlo.',
          situacion: 'Notás que la bomba 3 está dando lecturas raras en el marcador. Justo entra otro auto y te llaman.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Atendés el auto y te olvidás del problema.' },
            { letra: 'B', texto: 'Avisás rápido a tu compañero o encargado antes de ir a atender.' },
            { letra: 'C', texto: 'Esperás a que el problema se note solo.' },
            { letra: 'D', texto: 'Dejás de atender y revisás la bomba primero.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   '¡Bien! Una falla en el surtidor puede cobrar de más o de menos. Reportarla primero evita problemas mayores.',
          feedback_incorrecto: 'Una falla técnica en la bomba debe reportarse de inmediato al encargado. Es prioritario respecto a seguir atendiendo.',
          competencias_criticas: ['Comunicación', 'Seguridad laboral'],
        },
      },

      // ── Módulo 6 ─────────────────────────────────────────────────────────
      {
        titulo: 'Manejar varios clientes al mismo tiempo',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En horas pico, pueden llegar varios autos al mismo tiempo. Un buen playero organiza la atención sin perder la calidad del servicio ni hacer esperar de más a nadie.',
          situacion: 'Hay tres autos esperando y estás solo. Dos tocan bocina y uno ya se está yendo.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Atendés al que más bocina hace primero.' },
            { letra: 'B', texto: 'Gritás a todos que esperen y seguís con el auto que estás atendiendo.' },
            { letra: 'C', texto: 'Saludás y levantás la mano para indicar que ya los atendés, terminás lo que estás haciendo y los llamás en orden.' },
            { letra: 'D', texto: 'Dejás todo y vas a buscar a un compañero.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Mantener el orden de llegada y comunicar es lo más profesional.',
          feedback_incorrecto: 'En situaciones de alta demanda, terminar lo que estás haciendo y comunicar el orden es lo correcto.',
          competencias_criticas: ['Manejo de situaciones de demanda'],
        },
      },

      // ── Módulo 7 ─────────────────────────────────────────────────────────
      {
        titulo: 'Tarea que no conocés',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En el primer tiempo en un trabajo nuevo, es normal no saber hacer todo. Preguntar no es una debilidad; es la actitud correcta para aprender sin cometer errores.',
          situacion: 'El encargado te pide que hagas el cierre de la bomba 2, pero es algo que nunca hiciste.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Decís que sí y lo intentás sin preguntar, a ver si sale.' },
            { letra: 'B', texto: 'Decís que no podés y esperás que lo haga otro.' },
            { letra: 'C', texto: 'Pedís que alguien te muestre cómo hacerlo antes de hacerlo solo.' },
            { letra: 'D', texto: 'Lo hacés como creés que es y no decís nada.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Preguntar antes de hacer una tarea desconocida es la actitud correcta. Evitás errores y aprendés bien desde el principio.',
          feedback_incorrecto: 'Ante una tarea desconocida, siempre pedí que te enseñen. Es mejor preguntar que equivocarse con algo importante.',
          competencias_criticas: ['Aprendizaje en el puesto'],
        },
      },

      // ── Módulo 8 ─────────────────────────────────────────────────────────
      {
        titulo: 'Recibir una corrección del encargado',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Recibir correcciones es parte del aprendizaje. La actitud ante una observación del encargado dice mucho de un trabajador. Lo mejor es escuchar, agradecer y aplicar la corrección.',
          situacion: 'El encargado te dice que llenaste mal el formulario de ingreso de turno. Vos creías haberlo hecho bien.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Explicás que lo hiciste como te enseñaron y no lo cambiás.' },
            { letra: 'B', texto: 'Te enojás porque pensás que lo hiciste bien.' },
            { letra: 'C', texto: 'Escuchás la corrección, pedís que te explique cómo hacerlo bien y lo corregís.' },
            { letra: 'D', texto: 'Aceptás sin entender y lo hacés igual que antes.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Perfecto. Escuchar, entender y corregir es la actitud que valoran los encargados.',
          feedback_incorrecto: 'Recibir una corrección bien implica escuchar, preguntar si no entendiste y aplicar el cambio.',
          competencias_criticas: ['Aprendizaje en el puesto', 'Comunicación'],
        },
      },

      // ── Módulo 9 ─────────────────────────────────────────────────────────
      {
        titulo: 'Cobro y cambio al cliente',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El cobro es una parte sensible del trabajo. Hay que verificar el monto, entregar el vuelto correcto y siempre dar el ticket al cliente. Un error en el cobro puede generar desconfianza o un problema con el encargado.',
          situacion: 'El cliente cargó $5.000 de nafta. Te da un billete de $10.000. Le dás $4.000 de vuelto por error.',
          pregunta: '¿Qué hacés cuando te das cuenta?',
          opciones: [
            { letra: 'A', texto: 'No decís nada y esperás a ver si el cliente se da cuenta.' },
            { letra: 'B', texto: 'Avisás al encargado y le ofrecés el vuelto correcto al cliente.' },
            { letra: 'C', texto: 'Le pedís al cliente que vuelva a contar el dinero.' },
            { letra: 'D', texto: 'Lo registrás en el cuaderno y lo arreglás al cierre.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Informar al encargado y devolver lo correcto es lo más honesto y profesional.',
          feedback_incorrecto: 'Ante un error en el cobro, la honestidad es clave. Hay que informar y corregir de inmediato.',
          competencias_criticas: ['Cumplimiento de procedimientos', 'Comunicación'],
        },
      },

      // ── Módulo 10 ────────────────────────────────────────────────────────
      {
        titulo: 'Trabajo en equipo en el turno',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En una estación de servicio, el trabajo en equipo es fundamental. Cuando un compañero está desbordado o necesita ayuda, lo correcto es colaborar si tu tarea lo permite.',
          situacion: 'Tu compañero está atendiendo tres autos a la vez y ves que está muy ocupado. Vos terminaste de atender y estás libre.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Esperás que te llamen antes de moverte.' },
            { letra: 'B', texto: 'Te acercás y le preguntás si necesita ayuda.' },
            { letra: 'C', texto: 'Empezás a atender autos directamente sin consultar.' },
            { letra: 'D', texto: 'Aprovechás para hacer una pausa.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Ofrecer ayuda proactivamente es trabajo en equipo real.',
          feedback_incorrecto: 'Cuando tenés tiempo libre y ves a un compañero desbordado, lo correcto es ofrecerle ayuda.',
          competencias_criticas: ['Trabajo en equipo'],
        },
      },

      // ── Desafío Final ────────────────────────────────────────────────────
      {
        titulo:       'Desafío Final — Tu primer turno completo',
        tipo:         'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer turno en la estación. El encargado te dijo que vas a estar a cargo de las bombas 1 y 2. Hay movimiento constante y tu compañero está en la otra punta de la playa. En este turno vas a enfrentar varias situaciones que pondrán a prueba lo que aprendiste.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Llega un auto. El conductor no dice nada, solo abre la tapa del tanque.',
              pregunta:  '¿Cómo lo atendés?',
              opciones: [
                { letra: 'A', texto: 'Cargás nafta súper que es la más común.' },
                { letra: 'B', texto: 'Saludás y preguntás qué combustible y cuánto quiere cargar.' },
                { letra: 'C', texto: 'Esperás que él hable primero.' },
                { letra: 'D', texto: 'Le preguntás solo la cantidad.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Siempre confirmar tipo y cantidad. Es la primera regla del servicio.',
              peso: 15,
            },
            {
              id:       'df_2',
              situacion: 'Mientras cargás gasoil, el cliente baja y enciende un encendedor para ver adentro del baúl.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Cortás la carga inmediatamente y le pedís que apague el encendedor.' },
                { letra: 'B', texto: 'Seguís cargando y le decís que tenga cuidado.' },
                { letra: 'C', texto: 'Avisás al encargado desde lejos.' },
                { letra: 'D', texto: 'No decís nada para no generar conflicto.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Ante fuego cerca del surtidor, se actúa de inmediato. La seguridad es prioritaria.',
              peso: 15,
            },
            {
              id:       'df_3',
              situacion: 'Terminás de cobrar y te das cuenta de que le diste mal el vuelto: te sobraron $500.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo guardás y lo anotás para dárselo si vuelve.' },
                { letra: 'B', texto: 'Llamás al cliente antes de que se vaya y le entregás el vuelto correcto.' },
                { letra: 'C', texto: 'Lo dejás pasar porque es poca plata.' },
                { letra: 'D', texto: 'Lo ponés en la caja y avisás al encargado al cierre.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Honestidad inmediata. Siempre devolver lo que corresponde sin esperar.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Se acumulan tres autos y estás solo. Todos tocan bocina.',
              pregunta:  '¿Cómo manejás la situación?',
              opciones: [
                { letra: 'A', texto: 'Gritás "¡esperen!" y seguís con el auto que estás atendiendo sin más.' },
                { letra: 'B', texto: 'Levantás la mano para señalar que los viste, terminás lo que estás haciendo y los llamás en orden.' },
                { letra: 'C', texto: 'Vas al que más bocina hace.' },
                { letra: 'D', texto: 'Dejás todo y buscás a un compañero.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Orden, calma y comunicación. Los clientes esperan mejor si saben que los viste.',
              peso: 10,
            },
            {
              id:       'df_5',
              situacion: 'El encargado te pide que anotes el stock de aceites pero no sabés cómo se hace.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo hacés como te parece y no decís nada.' },
                { letra: 'B', texto: 'Decís que no podés y esperás que lo haga otro.' },
                { letra: 'C', texto: 'Le pedís que te muestre cómo hacerlo.' },
                { letra: 'D', texto: 'Lo copiás del día anterior sin verificar.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Preguntar antes de hacer una tarea desconocida es aprendizaje en el puesto.',
              peso: 10,
            },
            {
              id:       'df_6',
              situacion: 'Tu compañero está desbordado con cuatro autos. Vos terminaste y estás libre.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Esperás que te llamen.' },
                { letra: 'B', texto: 'Te acercás y le preguntás cómo podés ayudar.' },
                { letra: 'C', texto: 'Empezás a atender directamente sin avisarle.' },
                { letra: 'D', texto: 'Aprovechás para ir al baño.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Trabajo en equipo: ofrecer ayuda cuando tenés disponibilidad.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'La bomba 2 marca un número raro en el contador. No sabés si es falla o calibración.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Seguís usándola porque no parece grave.' },
                { letra: 'B', texto: 'La cerrás y avisás al encargado de inmediato.' },
                { letra: 'C', texto: 'Avisás al turno siguiente.' },
                { letra: 'D', texto: 'Le preguntás a un compañero y entre los dos decidís.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Una falla técnica debe reportarse al encargado de inmediato. No se sigue operando hasta saber qué pasa.',
              peso: 15,
            },
            {
              id:       'df_8',
              situacion: 'Al final del turno, el encargado te dice que hiciste bien el trabajo pero que tenés que saludar más al cliente al despedirte.',
              pregunta:  '¿Cómo respondés?',
              opciones: [
                { letra: 'A', texto: 'Explicás que estabas muy ocupado y no había tiempo.' },
                { letra: 'B', texto: 'Agradecés la corrección y te comprometés a mejorar.' },
                { letra: 'C', texto: 'Asentís pero no cambias nada.' },
                { letra: 'D', texto: 'Le decís que a los clientes no les importa.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Recibir una corrección con actitud positiva es la base del aprendizaje laboral.',
              peso: 15,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // Próximas capacitaciones — agregar acá (04 al 10)
  // ══════════════════════════════════════════════════════════════════════════

];

// ─── Runner ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding CAPACITATE...');

  for (const cap of CAPACITACIONES) {
    const { modulos, ...datos } = cap;

    // Upsert capacitación
    const contenido = await prisma.capacitateContenido.upsert({
      where:  { slug: cap.slug },
      create: { ...datos, competencias: datos.competencias },
      update: { ...datos, competencias: datos.competencias },
    });

    // Borrar módulos existentes y recrear (seed idempotente)
    await prisma.capacitateModulo.deleteMany({ where: { contenido_id: contenido.id } });

    for (let i = 0; i < modulos.length; i++) {
      const m = modulos[i];
      await prisma.capacitateModulo.create({
        data: {
          contenido_id:     contenido.id,
          orden:            i + 1,
          titulo:           m.titulo,
          tipo:             m.tipo,
          contenido:        m.contenido,
          es_desafio_final: m.es_desafio_final ?? false,
        },
      });
    }

    console.log(`  ✓ ${cap.titulo} (${modulos.length} módulos)`);
  }

  console.log('✅ Seed completado.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
