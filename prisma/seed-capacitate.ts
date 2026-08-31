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
  // 04 — ASISTENTE DE E-COMMERCE
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'asistente-ecommerce',
    titulo:       'Asistente de E-commerce',
    categoria:    'digitales',
    descripcion:  'Aprendé a gestionar productos, pedidos, stock y clientes en una tienda online.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para trabajar en la operación diaria de una tienda online: productos, stock, pedidos, consultas y herramientas digitales.',
    competencias: [
      'Operación de e-commerce',
      'Gestión de productos',
      'Control de stock',
      'Gestión de pedidos',
      'Atención digital',
      'Control de información',
      'Organización de tareas',
      'Herramientas digitales',
      'Resolución de problemas',
      'Adaptabilidad',
    ],
    icono:  '🛒',
    orden:  4,
    modulos: [

      {
        titulo: '¿Qué hace un asistente de e-commerce?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un e-commerce es un negocio que vende a través de internet. Detrás de cada venta hay muchas tareas operativas: cargar productos, actualizar precios, controlar stock, gestionar pedidos, responder consultas y preparar reportes. Un asistente de e-commerce no necesita programar — su función es mantener la operación digital ordenada y funcionando correctamente.',
          situacion: 'Una persona te pregunta qué hace un asistente de e-commerce.',
          pregunta: '¿Cuál de estas opciones describe mejor el trabajo?',
          opciones: [
            { letra: 'A', texto: 'Diseña y programa toda la tienda online.' },
            { letra: 'B', texto: 'Solamente responde mensajes de clientes.' },
            { letra: 'C', texto: 'Ayuda a gestionar productos, pedidos, información y tareas de la operación online.' },
            { letra: 'D', texto: 'Se ocupa únicamente de publicar contenido en redes sociales.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. El asistente cumple distintas tareas operativas que permiten que la tienda funcione correctamente.',
          feedback_incorrecto: 'El asistente de e-commerce realiza tareas variadas: productos, pedidos, stock, consultas y más.',
          competencias_criticas: ['Operación de e-commerce'],
        },
      },

      {
        titulo: 'Conocer la tienda online',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de trabajar en una tienda hay que entender cómo está organizada: categorías, productos, variantes, precios, stock, métodos de pago y envío, estados de pedidos. Cada negocio puede usar plataformas distintas, pero la lógica de trabajo es similar.',
          situacion: 'Comenzás a trabajar en una tienda online que no conocés.',
          pregunta: '¿Qué conviene hacer primero?',
          opciones: [
            { letra: 'A', texto: 'Modificar algunos productos para aprender cómo funciona.' },
            { letra: 'B', texto: 'Explorar el sistema y conocer cómo está organizada la tienda antes de realizar cambios.' },
            { letra: 'C', texto: 'Preguntarle al cliente cómo funciona.' },
            { letra: 'D', texto: 'Copiar la configuración de otra tienda.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Antes de modificar hay que conocer el sistema y los procedimientos del negocio.',
          feedback_incorrecto: 'Siempre conviene explorar y entender primero, antes de hacer cambios.',
          competencias_criticas: ['Operación de e-commerce'],
        },
      },

      {
        titulo: 'Cargar un producto',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una publicación debe tener información suficiente para que el cliente entienda qué está comprando: nombre, descripción, imágenes, precio, categoría, stock e información de entrega. La información incorrecta puede generar consultas, reclamos o ventas equivocadas.',
          situacion: 'Te piden cargar un nuevo producto, pero falta información importante.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Inventás los datos que faltan para terminar rápido.' },
            { letra: 'B', texto: 'Copiás la información de un producto parecido.' },
            { letra: 'C', texto: 'Publicás el producto incompleto y después lo corregís.' },
            { letra: 'D', texto: 'Identificás qué información falta y la solicitás o verificás antes de publicarlo.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. Publicar información incompleta o incorrecta genera problemas para el cliente y el negocio.',
          feedback_incorrecto: 'Nunca hay que inventar ni publicar incompleto. Primero verificar, después publicar.',
          competencias_criticas: ['Gestión de productos', 'Control de información'],
        },
      },

      {
        titulo: 'Precios y stock',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El precio y la disponibilidad deben estar siempre actualizados. Una diferencia entre el stock real y el publicado puede generar una mala experiencia para el cliente: vende algo que no tiene, o pierde ventas por mostrar cero cuando hay producto.',
          situacion: 'El sistema muestra que quedan 5 unidades, pero el depósito te informa que solo quedan 2.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Informás la diferencia y verificás cuál es el dato correcto antes de modificar.' },
            { letra: 'B', texto: 'Dejás 5 porque es lo que muestra el sistema.' },
            { letra: 'C', texto: 'Cambiás el stock a 0 sin consultar.' },
            { letra: 'D', texto: 'Esperás hasta que alguien haga una compra.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. Cuando dos fuentes difieren, hay que verificar antes de modificar.',
          feedback_incorrecto: 'Ante una diferencia entre fuentes, primero verificar cuál es el dato real.',
          competencias_criticas: ['Control de stock'],
        },
      },

      {
        titulo: 'Gestión de pedidos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una venta online no termina cuando el cliente hace clic en "comprar". Después hay que controlar el estado del pedido. Un pedido pasa por etapas: recibido → confirmado → preparado → despachado → entregado. Si un pedido queda demorado en una etapa, hay que investigar y actuar.',
          situacion: 'Encontrás un pedido que lleva mucho tiempo sin cambiar de estado.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Lo marcás como entregado para cerrar el pedido.' },
            { letra: 'B', texto: 'Lo eliminás.' },
            { letra: 'C', texto: 'Revisás la información disponible y consultás al área correspondiente.' },
            { letra: 'D', texto: 'Esperás varios días más sin hacer nada.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. Detectar anomalías y comunicarlas es parte clave del trabajo.',
          feedback_incorrecto: 'Nunca inventar un estado. Siempre investigar y reportar al área correspondiente.',
          competencias_criticas: ['Gestión de pedidos'],
        },
      },

      {
        titulo: 'Atención de consultas',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El asistente de e-commerce recibe consultas sobre productos, stock, precios, envíos, cambios y devoluciones. La respuesta debe basarse siempre en información real. Nunca hay que inventar datos para resolver rápido.',
          situacion: 'Un cliente pregunta cuándo recibirá su pedido, pero no tenés información suficiente para confirmarlo.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Le das una fecha aproximada para que quede tranquilo.' },
            { letra: 'B', texto: 'Verificás el estado y le comunicás la información disponible sin prometer algo que no podés confirmar.' },
            { letra: 'C', texto: 'Le decís que consulte con otra persona sin revisar nada.' },
            { letra: 'D', texto: 'Le respondés que seguramente llegará pronto.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. En atención digital, nunca prometer lo que no podemos garantizar.',
          feedback_incorrecto: 'Siempre verificar y comunicar solo lo que es cierto.',
          competencias_criticas: ['Atención digital'],
        },
      },

      {
        titulo: 'Errores en una publicación',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Los errores pueden aparecer en precio, descripción, imagen, categoría, stock o variantes. Detectarlos rápido evita ventas equivocadas. Pero antes de modificar información sensible, hay que verificar y comunicar.',
          situacion: 'Ves que una publicación tiene un precio muy diferente al que figura en la planilla oficial.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Cambiás el precio inmediatamente según tu criterio.' },
            { letra: 'B', texto: 'Eliminás la publicación.' },
            { letra: 'C', texto: 'Esperás a que algún cliente reclame.' },
            { letra: 'D', texto: 'Comparás con la fuente oficial y comunicás la diferencia antes de realizar un cambio no autorizado.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. No hay que modificar datos sensibles sin verificar y obtener autorización.',
          feedback_incorrecto: 'Verificar con la fuente oficial y comunicar antes de hacer cambios no autorizados.',
          competencias_criticas: ['Control de información'],
        },
      },

      {
        titulo: 'Organización de tareas',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En e-commerce pueden aparecer muchas tareas al mismo tiempo: actualizar productos, responder consultas, revisar pedidos, controlar stock, preparar reportes. No todo tiene la misma prioridad. Organizar por urgencia e impacto permite trabajar mejor.',
          situacion: 'Tenés que responder una consulta urgente, actualizar un producto y revisar un pedido bloqueado.',
          pregunta: '¿Cuál es una buena forma de organizarte?',
          opciones: [
            { letra: 'A', texto: 'Hacés primero la tarea que te resulte más fácil.' },
            { letra: 'B', texto: 'Empezás todas al mismo tiempo.' },
            { letra: 'C', texto: 'Priorizás según urgencia e impacto y organizás el resto.' },
            { letra: 'D', texto: 'Esperás a que alguien te diga qué hacer con cada tarea.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Correcto. Priorizar permite trabajar mejor cuando hay varias tareas simultáneas.',
          feedback_incorrecto: 'Organizar por prioridad es clave cuando hay múltiples tareas.',
          competencias_criticas: ['Organización de tareas'],
        },
      },

      {
        titulo: 'Herramientas digitales',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un asistente de e-commerce puede usar distintas herramientas: plataformas de tienda, planillas, correo, sistemas de gestión, herramientas de envío. No necesitás saber todas de memoria. Lo importante es aprender a seguir procesos y adaptarte a nuevas herramientas.',
          situacion: 'La empresa incorpora una nueva herramienta que nunca utilizaste.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Pedís acceso a documentación o capacitación y practicás antes de realizar tareas importantes.' },
            { letra: 'B', texto: 'Evitás usarla.' },
            { letra: 'C', texto: 'Probás directamente con pedidos reales.' },
            { letra: 'D', texto: 'Seguís usando la herramienta anterior aunque te indiquen otra.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Bien. Adaptarse a nuevas herramientas es una competencia clave en trabajos digitales.',
          feedback_incorrecto: 'Siempre pedir documentación o capacitación antes de trabajar con datos reales.',
          competencias_criticas: ['Adaptabilidad', 'Herramientas digitales'],
        },
      },

      {
        titulo: 'Control antes de publicar',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de publicar o modificar información importante, conviene controlar: ¿es correcto? ¿está completo? ¿coincide con la información oficial? ¿está autorizado el cambio? El control final ayuda a detectar errores antes de que lleguen al cliente.',
          situacion: 'Terminaste de cargar diez productos.',
          pregunta: '¿Qué conviene hacer antes de dar la tarea por terminada?',
          opciones: [
            { letra: 'A', texto: 'Publicarlos inmediatamente.' },
            { letra: 'B', texto: 'Revisar solamente algunos.' },
            { letra: 'C', texto: 'Esperar que otra persona encuentre los errores.' },
            { letra: 'D', texto: 'Revisar la información cargada según los criterios definidos antes de finalizar.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Exacto. El control final evita que los errores lleguen al cliente.',
          feedback_incorrecto: 'Siempre revisar todo antes de publicar, no solo una parte.',
          competencias_criticas: ['Control de información'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primer día como asistente de e-commerce',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer día trabajando en la tienda online de una empresa de indumentaria. Tenés acceso al sistema, a la planilla de precios y al chat de atención al cliente. Durante el turno vas a enfrentar situaciones reales que pondrán a prueba lo que aprendiste.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Te piden cargar un producto nuevo. Tenés nombre y precio, pero falta la descripción y no hay imágenes.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo publicás con los datos que tenés y completás después.' },
                { letra: 'B', texto: 'Inventás una descripción similar a otro producto.' },
                { letra: 'C', texto: 'Ponés "sin descripción" para no dejar el campo vacío.' },
                { letra: 'D', texto: 'Identificás qué falta y lo solicitás antes de publicar.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Publicar incompleto genera consultas y reclamos. Primero completar la información.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'La tienda muestra 8 unidades disponibles de un producto. El depósito avisa que solo quedan 3.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Informás la diferencia y verificás cuál es el dato correcto antes de actualizar.' },
                { letra: 'B', texto: 'Dejás 8 porque es lo que dice el sistema.' },
                { letra: 'C', texto: 'Cambiás a 3 inmediatamente sin consultar.' },
                { letra: 'D', texto: 'Ponés 0 para no vender sin stock.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Ante inconsistencia entre fuentes, siempre verificar antes de modificar.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'Encontrás un pedido en estado "confirmado" desde hace 5 días sin cambios.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo marcás como "entregado" para limpiarlo del sistema.' },
                { letra: 'B', texto: 'Revisás la información y consultás al área correspondiente.' },
                { letra: 'C', texto: 'Lo eliminás y esperás que el cliente reclame.' },
                { letra: 'D', texto: 'Esperás otros 5 días antes de actuar.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Un pedido sin movimiento es una señal de alerta. Hay que investigar y comunicar.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Un cliente pregunta cuándo llegará su pedido. Solo sabés que fue despachado ayer.',
              pregunta:  '¿Qué respondés?',
              opciones: [
                { letra: 'A', texto: 'Le decís "en 48 horas" para que quede tranquilo.' },
                { letra: 'B', texto: 'Le decís que busque en el correo de envío.' },
                { letra: 'C', texto: 'Le informás que fue despachado y que vas a verificar el estado para darle más info.' },
                { letra: 'D', texto: 'Ignorás la consulta hasta tener información completa.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Comunicar lo que sabés y comprometerte a verificar es la respuesta correcta.',
              peso: 15,
            },
            {
              id:       'df_5',
              situacion: 'Una publicación muestra $1.500 pero en la planilla oficial figura $15.000.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Cambiás a $15.000 inmediatamente.' },
                { letra: 'B', texto: 'Lo dejás porque puede ser una promo.' },
                { letra: 'C', texto: 'Eliminás la publicación.' },
                { letra: 'D', texto: 'Comparás con la fuente oficial y comunicás la diferencia al responsable antes de modificar.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'No modificar datos sensibles sin verificar y obtener autorización.',
              peso: 15,
            },
            {
              id:       'df_6',
              situacion: 'Tenés que: responder una consulta urgente, actualizar 20 productos y preparar un reporte para el lunes.',
              pregunta:  '¿Cómo organizás?',
              opciones: [
                { letra: 'A', texto: 'Hacés primero los 20 productos porque es la tarea más larga.' },
                { letra: 'B', texto: 'Priorizás según urgencia: primero la consulta, luego lo que tenga fecha límite más próxima.' },
                { letra: 'C', texto: 'Hacés todo al mismo tiempo.' },
                { letra: 'D', texto: 'Esperás instrucciones antes de empezar.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Urgencia e impacto definen las prioridades en e-commerce.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'La empresa migra a una nueva plataforma de e-commerce que nunca usaste.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Pedís documentación o capacitación y practicás antes de trabajar con datos reales.' },
                { letra: 'B', texto: 'Seguís con la plataforma anterior aunque te indiquen que no.' },
                { letra: 'C', texto: 'Probás directamente con productos reales para aprender más rápido.' },
                { letra: 'D', texto: 'Decís que no podés trabajar hasta conocerla mejor.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Aprender la herramienta antes de usarla en producción evita errores costosos.',
              peso: 15,
            },
            {
              id:       'df_8',
              situacion: 'Terminaste de cargar 15 productos nuevos. Son las 17:30 y el responsable los necesita publicados.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Los publicás directamente para cumplir el horario.' },
                { letra: 'B', texto: 'Revisás rápido solo el primero y el último.' },
                { letra: 'C', texto: 'Revisás que la información esté correcta y completa antes de publicar.' },
                { letra: 'D', texto: 'Le pedís al responsable que los revise él.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'El control final es parte del trabajo. Unos minutos de revisión evitan errores que llegan a los clientes.',
              peso: 15,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 05 — ATENCIÓN AL CLIENTE DIGITAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'atencion-cliente-digital',
    titulo:       'Atención al Cliente Digital',
    categoria:    'digitales',
    descripcion:  'Aprendé a responder consultas, resolver problemas y atender clientes por canales digitales.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para trabajar en atención al cliente por WhatsApp, chat, redes sociales y correo, resolviendo consultas, reclamos y derivaciones con criterio profesional.',
    competencias: [
      'Atención al cliente digital',
      'Comunicación escrita',
      'Gestión de consultas',
      'Manejo de reclamos',
      'Resolución de problemas',
      'Organización de conversaciones',
      'Herramientas digitales',
      'Uso responsable de IA',
      'Creación de prompts',
      'Profesionalismo digital',
    ],
    icono:  '💬',
    orden:  5,
    modulos: [

      {
        titulo: '¿Qué hace una persona de atención digital?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La atención digital consiste en ayudar a clientes a través de canales online: WhatsApp, chat web, redes sociales, correo. Puede incluir responder consultas, brindar información, tomar pedidos, realizar seguimientos, resolver problemas, gestionar reclamos y derivar casos. El objetivo siempre es el mismo: ayudar al cliente de manera clara, rápida y profesional.',
          situacion: 'Una empresa recibe consultas por WhatsApp durante todo el día.',
          pregunta: '¿Qué tarea podría realizar una persona de atención digital?',
          opciones: [
            { letra: 'A', texto: 'Responder consultas y ayudar a los clientes siguiendo los procedimientos de la empresa.' },
            { letra: 'B', texto: 'Responder solamente los mensajes que parezcan importantes.' },
            { letra: 'C', texto: 'Contestar usando siempre la misma respuesta.' },
            { letra: 'D', texto: 'Eliminar las consultas que no pueda resolver.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Exacto. La atención digital requiere gestionar todas las consultas y acompañar al cliente.',
          feedback_incorrecto: 'La atención digital implica gestionar todas las consultas, no solo algunas.',
          competencias_criticas: ['Atención al cliente digital'],
        },
      },

      {
        titulo: 'Escribir para que te entiendan',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En un chat no tenemos el tono de voz ni los gestos de una conversación presencial. Por eso escribir claramente es fundamental. Una buena respuesta debe ser clara, breve, correcta, cordial y fácil de entender. No hace falta ser excesivamente formal.',
          situacion: 'Un cliente pregunta cómo realizar un cambio.',
          pregunta: '¿Cuál sería una mejor respuesta?',
          opciones: [
            { letra: 'A', texto: '"Cambios según términos y condiciones."' },
            { letra: 'B', texto: '"Hola. Sí, podés solicitar el cambio. Te explico los pasos: primero necesitás..."' },
            { letra: 'C', texto: '"Leé la página."' },
            { letra: 'D', texto: '"Eso lo tenés que ver con cambios."' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Una buena respuesta no solo informa: orienta al cliente sobre qué tiene que hacer.',
          feedback_incorrecto: 'La respuesta debe ser clara, cordial y orientar concretamente al cliente.',
          competencias_criticas: ['Comunicación escrita'],
        },
      },

      {
        titulo: 'Leer antes de responder',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Responder rápido no sirve si no entendiste la consulta. Antes de contestar hay que leer qué pregunta el cliente, qué información ya proporcionó, qué ocurrió antes y qué necesita resolver. Leer el contexto evita pedir información que el cliente ya dio.',
          situacion: 'Un cliente explica un problema en tres mensajes y te pregunta si puede realizar un cambio.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Respondés solamente al último mensaje.' },
            { letra: 'B', texto: 'Le enviás una respuesta automática.' },
            { letra: 'C', texto: 'Leés toda la conversación antes de responder.' },
            { letra: 'D', texto: 'Le pedís que vuelva a explicar todo.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. Leer el contexto completo permite responder correctamente sin repetir preguntas.',
          feedback_incorrecto: 'Siempre leer toda la conversación antes de responder.',
          competencias_criticas: ['Gestión de consultas'],
        },
      },

      {
        titulo: 'No inventar información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una de las reglas más importantes: si no sabés, verificás. Nunca conviene inventar precios, fechas, promociones, condiciones, estados de pedidos o políticas. Dar información falsa puede generar reclamos y pérdida de confianza.',
          situacion: 'Un cliente pregunta si una promoción continúa vigente, pero no encontrás información actualizada.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Le decís que probablemente sí.' },
            { letra: 'B', texto: 'Le confirmás que sí para no perder la venta.' },
            { letra: 'C', texto: 'Le decís que seguramente terminó.' },
            { letra: 'D', texto: 'Verificás la información o consultás al área correspondiente antes de confirmarla.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. Cuando no tenés certeza, primero verificás antes de informar.',
          feedback_incorrecto: 'Nunca inventar. Siempre verificar antes de confirmar algo al cliente.',
          competencias_criticas: ['Atención al cliente digital'],
        },
      },

      {
        titulo: 'Manejo de reclamos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un reclamo digital puede llegar como mensaje, audio, comentario o correo. La persona que atiende debe evitar responder impulsivamente. Una buena secuencia es: leer → comprender → verificar → responder → resolver o derivar.',
          situacion: 'Un cliente escribe enojado: "Hace tres días estoy esperando y nadie me responde."',
          pregunta: '¿Qué respuesta es más adecuada?',
          opciones: [
            { letra: 'A', texto: '"Ya te vamos a responder."' },
            { letra: 'B', texto: '"No depende de nosotros."' },
            { letra: 'C', texto: '"Entiendo la molestia. Voy a revisar el estado de tu caso y te informo cómo continuar."' },
            { letra: 'D', texto: '"Tenés que esperar."' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. Reconocer el problema y explicar qué vas a hacer permite avanzar sin discutir.',
          feedback_incorrecto: 'Ante un reclamo: reconocer, no justificar, y explicar qué va a pasar.',
          competencias_criticas: ['Manejo de reclamos'],
        },
      },

      {
        titulo: 'Cuándo derivar',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'No todos los problemas pueden resolverse desde atención. Algunos requieren intervención de supervisores, administración, logística, facturación o soporte técnico. Derivar correctamente también es parte del trabajo. Derivar no significa sacarse el problema: significa llevarlo al lugar correcto.',
          situacion: 'Un cliente solicita una modificación que solo puede autorizar un supervisor.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Decís que no se puede.' },
            { letra: 'B', texto: 'Prometés que la vas a realizar.' },
            { letra: 'C', texto: 'Ignorás el mensaje.' },
            { letra: 'D', texto: 'Explicás que vas a derivar el caso al área correspondiente y registrás la situación.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Derivar correctamente y dejar registro es parte de una buena atención.',
          feedback_incorrecto: 'Derivar bien significa llevar el caso al lugar correcto y dejar registro.',
          competencias_criticas: ['Resolución de problemas'],
        },
      },

      {
        titulo: 'Organizar conversaciones',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Cuando se reciben muchos mensajes, es fácil perder información. Es importante aprender a organizar: consultas pendientes, resueltas, casos urgentes, seguimientos y derivaciones. Sin organización, los clientes quedan sin respuesta.',
          situacion: 'Tenés veinte conversaciones abiertas y varias requieren seguimiento.',
          pregunta: '¿Qué conviene hacer?',
          opciones: [
            { letra: 'A', texto: 'Responder primero las que llegaron más recientemente.' },
            { letra: 'B', texto: 'Organizar las conversaciones según prioridad y estado.' },
            { letra: 'C', texto: 'Elegir las más fáciles.' },
            { letra: 'D', texto: 'Cerrar las que no puedas resolver inmediatamente.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Organizar por prioridad y estado evita olvidos y permite trabajar mejor.',
          feedback_incorrecto: 'Organizar por prioridad y estado es clave para no dejar clientes sin respuesta.',
          competencias_criticas: ['Organización de conversaciones'],
        },
      },

      {
        titulo: 'Usar IA como asistente',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En atención digital se puede usar IA para redactar respuestas, resumir conversaciones, ordenar información y preparar respuestas frecuentes. Pero la IA no reemplaza el criterio de la persona. Antes de enviar una respuesta generada por IA hay que revisarla.',
          situacion: 'Usás IA para redactar una respuesta a un cliente.',
          pregunta: '¿Qué hacés antes de enviarla?',
          opciones: [
            { letra: 'A', texto: 'La enviás directamente porque la escribió la IA.' },
            { letra: 'B', texto: 'Copiás solamente la primera parte.' },
            { letra: 'C', texto: 'Revisás que la información sea correcta y que la respuesta corresponda al caso.' },
            { letra: 'D', texto: 'Le preguntás al cliente si la respuesta de la IA está bien.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. La responsabilidad de la respuesta sigue siendo de quien la envía.',
          feedback_incorrecto: 'Siempre revisar el resultado de la IA antes de enviarlo al cliente.',
          competencias_criticas: ['Uso responsable de IA'],
        },
      },

      {
        titulo: 'Crear un buen prompt',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una herramienta de IA responde mejor cuando recibe una instrucción clara. Un buen prompt puede incluir: contexto + objetivo + información + tono + formato. Cuanto mejor explicás el contexto, más útil es el resultado.',
          situacion: 'Querés pedirle a una IA que redacte una respuesta profesional a un cliente molesto.',
          pregunta: '¿Cuál instrucción tiene más información útil?',
          opciones: [
            { letra: 'A', texto: '"Contestale esto."' },
            { letra: 'B', texto: '"Hacé una respuesta."' },
            { letra: 'C', texto: '"Escribí algo lindo para un cliente."' },
            { letra: 'D', texto: '"Redactá una respuesta breve y profesional para un cliente molesto por una demora. Reconocé la situación, explicá que estamos verificando el pedido y no prometas una fecha sin confirmar."' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Contexto, objetivo y límites producen un resultado mucho más útil.',
          feedback_incorrecto: 'Cuanto más contexto dás, más útil es la respuesta de la IA.',
          competencias_criticas: ['Creación de prompts'],
        },
      },

      {
        titulo: 'Profesionalismo digital',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Trabajar por internet no elimina las reglas laborales. También importa responder correctamente, respetar horarios, cuidar la información, mantener tono profesional, registrar los casos y revisar antes de enviar.',
          situacion: 'Terminaste de redactar una respuesta importante para un cliente.',
          pregunta: '¿Qué conviene hacer antes de enviarla?',
          opciones: [
            { letra: 'A', texto: 'Revisar destinatario, información, tono y posibles errores.' },
            { letra: 'B', texto: 'Enviarla inmediatamente para ahorrar tiempo.' },
            { letra: 'C', texto: 'Pedirle al cliente que interprete la información.' },
            { letra: 'D', texto: 'Copiar una respuesta anterior sin revisarla.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Exacto. Un segundo de revisión puede evitar errores que afectan al cliente y a la empresa.',
          feedback_incorrecto: 'Revisar antes de enviar siempre: destinatario, información, tono y errores.',
          competencias_criticas: ['Profesionalismo digital'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primer día en atención digital',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer turno atendiendo los canales digitales de una empresa de ropa online. Tenés acceso al sistema de pedidos y a la información de productos. Durante el día vas a recibir distintos tipos de mensajes que pondrán a prueba lo que aprendiste.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Un cliente pregunta por WhatsApp: "¿Tienen zapatillas talle 42?"',
              pregunta:  '¿Cómo respondés?',
              opciones: [
                { letra: 'A', texto: '"Sí, tenemos." (sin verificar)' },
                { letra: 'B', texto: 'Verificás el stock y respondés: "Hola, te confirmo: sí tenemos talle 42 en [modelos]. ¿Querés más info?"' },
                { letra: 'C', texto: '"Buscá en la web."' },
                { letra: 'D', texto: '"Eso lo ven en el local."' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Verificar antes de confirmar y ofrecer info adicional es atención de calidad.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'Un cliente mandó 4 mensajes explicando un problema con su pedido.',
              pregunta:  '¿Qué hacés primero?',
              opciones: [
                { letra: 'A', texto: 'Respondés al último mensaje solamente.' },
                { letra: 'B', texto: 'Le pedís que cuente todo de nuevo en un solo mensaje.' },
                { letra: 'C', texto: 'Leés toda la conversación para entender qué necesita antes de responder.' },
                { letra: 'D', texto: 'Enviás una respuesta automática de "ya te atendemos".' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Leer el contexto completo evita repetir preguntas y permite responder correctamente.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'Un cliente pregunta si un producto tiene garantía extendida. No encontrás información sobre eso.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Verificás con el área correspondiente antes de responder.' },
                { letra: 'B', texto: 'Le decís que sí tiene garantía.' },
                { letra: 'C', texto: 'Le decís que no tiene garantía.' },
                { letra: 'D', texto: 'Ignorás la pregunta.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Cuando no sabés, primero verificás. Nunca inventar información.',
              peso: 15,
            },
            {
              id:       'df_4',
              situacion: 'Un cliente escribe: "Ya van dos semanas y no recibí mi pedido. Esto es una estafa."',
              pregunta:  '¿Qué respondés?',
              opciones: [
                { letra: 'A', texto: '"No es nuestra culpa, es el correo."' },
                { letra: 'B', texto: '"Espere que lo verificamos." (sin más explicación)' },
                { letra: 'C', texto: '"Entiendo la molestia. Voy a revisar el estado de tu pedido ahora y te informo en breve."' },
                { letra: 'D', texto: '"Haga su reclamo formal por correo."' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Reconocer el problema y comprometerse a verificar es lo correcto ante un reclamo.',
              peso: 15,
            },
            {
              id:       'df_5',
              situacion: 'El cliente pide que le devuelvan el dinero, pero eso requiere autorización de administración.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Prometés la devolución.' },
                { letra: 'B', texto: 'Decís que no es posible.' },
                { letra: 'C', texto: 'Ignorás el mensaje.' },
                { letra: 'D', texto: 'Explicás que vas a derivar el caso al área correspondiente y registrás la situación.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Derivar correctamente y dejar registro es parte de la atención profesional.',
              peso: 10,
            },
            {
              id:       'df_6',
              situacion: 'Tenés 25 chats abiertos: consultas simples, reclamos activos y dos casos sin respuesta desde ayer.',
              pregunta:  '¿Cómo organizás?',
              opciones: [
                { letra: 'A', texto: 'Respondés el más nuevo primero.' },
                { letra: 'B', texto: 'Elegís los más fáciles.' },
                { letra: 'C', texto: 'Cerrás los que no podés resolver ahora.' },
                { letra: 'D', texto: 'Organizás por prioridad: primero reclamos y casos urgentes, luego consultas en orden.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Priorizar por urgencia e impacto garantiza que nadie quede sin atención.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'Necesitás responder a un cliente molesto por una demora. Usás IA para redactar.',
              pregunta:  '¿Cuál prompt es mejor?',
              opciones: [
                { letra: 'A', texto: '"Contestá al cliente."' },
                { letra: 'B', texto: '"Escribí una respuesta para alguien que se queja."' },
                { letra: 'C', texto: '"Redactá una respuesta breve y cordial para un cliente molesto por una demora. Reconocé el problema, aclará que estamos verificando el pedido y no prometas fechas no confirmadas."' },
                { letra: 'D', texto: '"Hacé algo empático."' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Contexto, objetivo y límites hacen que la IA genere un resultado útil.',
              peso: 15,
            },
            {
              id:       'df_8',
              situacion: 'Redactaste una respuesta importante sobre condiciones de devolución.',
              pregunta:  '¿Qué hacés antes de enviarla?',
              opciones: [
                { letra: 'A', texto: 'Revisás: destinatario, información, tono y posibles errores.' },
                { letra: 'B', texto: 'La enviás directamente.' },
                { letra: 'C', texto: 'Le pedís al cliente que corrija si hay algo mal.' },
                { letra: 'D', texto: 'Copiás una respuesta anterior sin revisarla.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Revisar antes de enviar evita errores que afectan la confianza del cliente.',
              peso: 15,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 06 — ASISTENTE DE REDES SOCIALES
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'asistente-redes-sociales',
    titulo:       'Asistente de Redes Sociales',
    categoria:    'digitales',
    descripcion:  'Aprendé a gestionar contenidos, publicaciones y comunidad en redes sociales para empresas.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para colaborar en la gestión cotidiana de redes sociales: planificar contenidos, preparar publicaciones, escribir copies, usar IA y analizar métricas.',
    competencias: [
      'Gestión de redes sociales',
      'Planificación de contenidos',
      'Copywriting',
      'Creación de prompts',
      'Uso de IA',
      'Contenidos visuales',
      'Atención digital',
      'Organización',
      'Métricas básicas',
      'Seguridad digital',
      'Identidad de marca',
    ],
    icono:  '📱',
    orden:  6,
    modulos: [

      {
        titulo: '¿Qué hace un asistente de redes sociales?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un asistente de redes sociales ayuda a mantener activas y ordenadas las cuentas digitales de una organización. Puede colaborar en: planificación de contenidos, carga de publicaciones, historias, reels, redacción de textos, selección de imágenes, programación, respuesta de comentarios, mensajes y seguimiento de métricas. Su trabajo es ejecutar, organizar y colaborar — no necesariamente definir toda la estrategia.',
          situacion: 'Una empresa te incorpora como asistente de redes.',
          pregunta: '¿Cuál de estas tareas corresponde al puesto?',
          opciones: [
            { letra: 'A', texto: 'Publicar cualquier contenido que se te ocurra.' },
            { letra: 'B', texto: 'Ayudar a planificar, preparar y publicar contenidos siguiendo los objetivos de la empresa.' },
            { letra: 'C', texto: 'Responder únicamente comentarios positivos.' },
            { letra: 'D', texto: 'Cambiar toda la estrategia de comunicación sin consultar.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. El asistente trabaja dentro de una estrategia y ejecuta las tareas necesarias.',
          feedback_incorrecto: 'El asistente ejecuta y organiza — no improvisa ni cambia la estrategia solo.',
          competencias_criticas: ['Gestión de redes sociales'],
        },
      },

      {
        titulo: 'Conocer la marca',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de publicar contenido hay que entender a quién representa la cuenta: qué vende, quién es su público, qué tono utiliza, qué temas puede comunicar y qué identidad visual tiene. No todas las marcas hablan de la misma manera.',
          situacion: 'Te piden preparar una publicación para una empresa con tono profesional y cercano.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Usás el tono que utilizás en tus redes personales.' },
            { letra: 'B', texto: 'Copiás el estilo de otra marca.' },
            { letra: 'C', texto: 'Revisás cómo comunica la empresa y adaptás el contenido a su identidad.' },
            { letra: 'D', texto: 'Escribís con palabras difíciles para parecer profesional.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. El contenido debe respetar la identidad de la marca.',
          feedback_incorrecto: 'Cuando trabajás para una marca, el contenido sigue su identidad, no tu estilo personal.',
          competencias_criticas: ['Identidad de marca'],
        },
      },

      {
        titulo: 'Planificar contenidos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Publicar en redes no significa improvisar todos los días. Un calendario de contenidos permite organizar qué se publica, cuándo, en qué canal, con qué objetivo y en qué formato. Esto ayuda a evitar repeticiones y olvidos.',
          situacion: 'Tenés que preparar las publicaciones de la semana.',
          pregunta: '¿Qué conviene hacer?',
          opciones: [
            { letra: 'A', texto: 'Publicar solamente cuando se te ocurra una buena idea.' },
            { letra: 'B', texto: 'Esperar a que haya tiempo libre.' },
            { letra: 'C', texto: 'Publicar varias cosas juntas sin planificación.' },
            { letra: 'D', texto: 'Organizar previamente los contenidos y fechas en un calendario.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Un calendario permite ordenar el trabajo y saber qué preparar y cuándo publicar.',
          feedback_incorrecto: 'Sin planificación es fácil olvidar publicaciones o repetir contenidos.',
          competencias_criticas: ['Planificación de contenidos', 'Organización'],
        },
      },

      {
        titulo: 'Escribir un copy',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El copy es el texto que acompaña una publicación. Un buen copy depende del objetivo: puede buscar informar, vender, generar interacción, explicar o invitar a realizar una acción. Antes de escribir hay que definir: ¿qué quiero comunicar? ¿a quién? ¿para qué?',
          situacion: 'La empresa quiere anunciar una promoción y lograr que las personas visiten el local.',
          pregunta: '¿Qué debería tener el copy?',
          opciones: [
            { letra: 'A', texto: 'Solamente muchos emojis.' },
            { letra: 'B', texto: 'Explicar claramente la promoción y orientar al usuario sobre qué acción realizar.' },
            { letra: 'C', texto: 'Un texto muy largo.' },
            { letra: 'D', texto: 'Copiar el texto de una promoción anterior.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. El copy debe responder al objetivo y facilitar que la persona sepa qué hacer.',
          feedback_incorrecto: 'El copy debe comunicar la promoción claramente y decirle al usuario qué hacer.',
          competencias_criticas: ['Copywriting'],
        },
      },

      {
        titulo: 'Crear un prompt para IA',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede ayudar a generar ideas y borradores, pero necesita instrucciones claras. Un prompt puede incluir: rol + contexto + objetivo + público + tono + formato. Cuanto más contexto dás, más útil es el resultado.',
          situacion: 'Necesitás generar ideas para una publicación de una cafetería que quiere promocionar un nuevo desayuno.',
          pregunta: '¿Cuál prompt está mejor planteado?',
          opciones: [
            { letra: 'A', texto: '"Dame ideas."' },
            { letra: 'B', texto: '"Haceme un post para Instagram."' },
            { letra: 'C', texto: '"Escribí algo creativo para una cafetería."' },
            { letra: 'D', texto: '"Actuá como asistente de contenidos. Proponé 5 ideas de publicaciones para Instagram para promocionar un nuevo desayuno de una cafetería de barrio. Público: jóvenes y adultos. Objetivo: generar visitas al local. Tono: cercano y simple."' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Exacto. El contexto y el objetivo permiten que la IA produzca ideas más útiles.',
          feedback_incorrecto: 'Cuanto más contexto dás, más útil es el resultado de la IA.',
          competencias_criticas: ['Creación de prompts', 'Uso de IA'],
        },
      },

      {
        titulo: 'Imágenes y videos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Las redes utilizan distintos formatos: fotografías, placas, historias, reels, videos cortos, carruseles. No hace falta ser diseñador profesional, pero sí cuidar aspectos básicos: buena calidad, texto legible, encuadre, coherencia con la marca y formato adecuado para cada plataforma.',
          situacion: 'Preparás una publicación pero el texto de la imagen es demasiado pequeño para leerlo desde un teléfono.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'La publicás igual.' },
            { letra: 'B', texto: 'Reducís todavía más el texto.' },
            { letra: 'C', texto: 'Pedís o realizás una versión donde la información sea legible.' },
            { letra: 'D', texto: 'Agregás más texto para explicar mejor.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Correcto. El contenido tiene que poder consumirse fácilmente desde el dispositivo del usuario.',
          feedback_incorrecto: 'Si el texto no se lee, el contenido no funciona. Hay que hacer una versión legible.',
          competencias_criticas: ['Contenidos visuales'],
        },
      },

      {
        titulo: 'Responder comentarios y mensajes',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La gestión de redes implica interactuar con personas. Hay que distinguir entre consultas, comentarios, reclamos, mensajes privados y spam. No todas las interacciones se responden de la misma manera.',
          situacion: 'Un usuario pregunta por mensaje privado el precio de un producto.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Le respondés con información actualizada y disponible.' },
            { letra: 'B', texto: 'Le decís que busque el precio en Google.' },
            { letra: 'C', texto: 'Le das un precio aproximado.' },
            { letra: 'D', texto: 'Ignorás el mensaje.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Bien. Una consulta concreta merece una respuesta clara y basada en información real.',
          feedback_incorrecto: 'Responder con información correcta y disponible es la actitud profesional.',
          competencias_criticas: ['Atención digital'],
        },
      },

      {
        titulo: 'Cuidar la información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Al administrar redes podés tener acceso a contraseñas, información interna, datos de clientes y material no publicado. Hay que proteger esa información y nunca compartirla por canales o con personas que no correspondan.',
          situacion: 'Un amigo te pide la contraseña de Instagram de la empresa para ayudarte a preparar una publicación.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Se la pasás porque confiás en él.' },
            { letra: 'B', texto: 'La compartís solamente por un rato.' },
            { letra: 'C', texto: 'Le mandás una captura con la contraseña.' },
            { letra: 'D', texto: 'No compartís la contraseña y usás los mecanismos de acceso autorizados por la empresa.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Los accesos deben manejarse de manera segura según los procedimientos establecidos.',
          feedback_incorrecto: 'Nunca compartir contraseñas. Los accesos se gestionan por los canales autorizados.',
          competencias_criticas: ['Seguridad digital'],
        },
      },

      {
        titulo: 'Mirar las métricas',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Las redes generan información sobre el comportamiento de las publicaciones: alcance, visualizaciones, interacciones, clics, seguidores, reproducciones. La métrica importante depende del objetivo de la publicación.',
          situacion: 'Una publicación tenía como objetivo llevar personas a una página web.',
          pregunta: '¿Qué dato sería especialmente útil analizar?',
          opciones: [
            { letra: 'A', texto: 'La cantidad de colores utilizados en la imagen.' },
            { letra: 'B', texto: 'La cantidad de seguidores de la cuenta.' },
            { letra: 'C', texto: 'Los clics o visitas generados hacia la página.' },
            { letra: 'D', texto: 'La cantidad de emojis del texto.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Exacto. Si el objetivo es generar visitas, hay que observar el indicador relacionado.',
          feedback_incorrecto: 'La métrica importante depende del objetivo. Si es tráfico, medís clics.',
          competencias_criticas: ['Métricas básicas'],
        },
      },

      {
        titulo: 'Revisar antes de publicar',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un error publicado puede ser visto por miles de personas. Antes de publicar hay que revisar: ortografía, precio, fechas, enlaces, imágenes, etiquetas, información, formato y cuenta correcta.',
          situacion: 'Terminaste una publicación y estás por programarla.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'La programás inmediatamente porque ya terminaste.' },
            { letra: 'B', texto: 'La revisás completa antes de publicarla.' },
            { letra: 'C', texto: 'Esperás que alguien encuentre los errores después.' },
            { letra: 'D', texto: 'Revisás solamente la imagen.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. La revisión final es parte fundamental del trabajo en redes.',
          feedback_incorrecto: 'Siempre revisar todo antes de publicar: texto, imagen, info, formato.',
          competencias_criticas: ['Organización'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primera semana en redes',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Te asignaron las redes sociales de una empresa de productos naturales. Tenés acceso a Instagram y a un calendario de contenidos en blanco. Durante la semana vas a enfrentar situaciones reales del trabajo.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Antes de publicar cualquier cosa, ¿qué hacés para conocer la marca?',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Publicás contenido genérico de salud y bienestar.' },
                { letra: 'B', texto: 'Revisás publicaciones anteriores, el tono, el público y los objetivos de la marca.' },
                { letra: 'C', texto: 'Copiás el estilo de otra cuenta similar.' },
                { letra: 'D', texto: 'Le preguntás al encargado qué publicar cada día.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Conocer la marca es el primer paso antes de crear cualquier contenido.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'Tenés que cubrir una semana completa de publicaciones. ¿Cómo arrancás?',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Organizás un calendario con los contenidos, formatos y fechas de cada publicación.' },
                { letra: 'B', texto: 'Publicás cuando se te ocurra algo.' },
                { letra: 'C', texto: 'Publicás varias cosas juntas en un solo día.' },
                { letra: 'D', texto: 'Esperás que el responsable te diga qué hacer cada día.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'El calendario permite organizar y no dejar publicaciones al azar.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'Te piden promocionar un nuevo producto de la línea. ¿Qué definís antes de crear el contenido?',
              pregunta:  '¿Qué definís primero?',
              opciones: [
                { letra: 'A', texto: 'Qué filtro usar en la imagen.' },
                { letra: 'B', texto: 'Cuántos emojis usar en el texto.' },
                { letra: 'C', texto: 'El objetivo de la publicación, el público y qué acción querés generar.' },
                { letra: 'D', texto: 'Si publicarlo en Stories o en el feed.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Objetivo y público primero. Después el formato y los detalles visuales.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Tenés que escribir el texto para una publicación sobre un nuevo producto.',
              pregunta:  '¿Cómo escribís el copy de la primera placa?',
              opciones: [
                { letra: 'A', texto: 'Copiás el copy de una publicación anterior.' },
                { letra: 'B', texto: 'Ponés el nombre y el logo de la empresa.' },
                { letra: 'C', texto: 'Escribís un texto largo explicando toda la historia.' },
                { letra: 'D', texto: 'Usás una frase corta que capture la atención y presente el tema.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'El copy de apertura debe captar la atención y orientar al usuario.',
              peso: 10,
            },
            {
              id:       'df_5',
              situacion: 'Usás IA para generar ideas de publicaciones para la semana.',
              pregunta:  '¿Cuál es el mejor prompt?',
              opciones: [
                { letra: 'A', texto: '"Dame posts para redes."' },
                { letra: 'B', texto: '"Proponé 5 ideas de publicaciones para Instagram de una marca de productos naturales para adultos de 25-45 años. Objetivo: aumentar visitas al sitio. Tono: cercano, sin tecnicismos. Una idea por día, lunes a viernes."' },
                { letra: 'C', texto: '"Hacé publicaciones creativas."' },
                { letra: 'D', texto: '"Quiero algo para Instagram."' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Contexto, público, objetivo y formato producen ideas mucho más útiles.',
              peso: 15,
            },
            {
              id:       'df_6',
              situacion: 'Preparás una Story con texto superpuesto a una imagen, pero el texto queda casi ilegible por el color del fondo.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'La publicás igual porque la imagen es linda.' },
                { letra: 'B', texto: 'La publicás y aclarás en el caption qué dice.' },
                { letra: 'C', texto: 'Ajustás el texto o el fondo para que la información sea claramente legible.' },
                { letra: 'D', texto: 'Eliminás el texto completamente.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'La legibilidad es básica. Si el texto no se lee, el contenido no funciona.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'Una persona pregunta en DM el precio de un producto. Tenés el catálogo actualizado.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Respondés con el precio correcto y ofrecés más información si la necesita.' },
                { letra: 'B', texto: 'Le decís que vea el perfil.' },
                { letra: 'C', texto: 'Le das un precio aproximado.' },
                { letra: 'D', texto: 'Ignorás el mensaje porque no es tu tarea vender.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Una consulta concreta merece una respuesta clara y basada en info real.',
              peso: 10,
            },
            {
              id:       'df_8',
              situacion: 'La publicación del martes tenía como objetivo llevar personas al sitio web. Tuvo 500 likes pero solo 20 clics.',
              pregunta:  '¿Qué conclusión sacás?',
              opciones: [
                { letra: 'A', texto: 'La publicación fue exitosa porque tuvo muchos likes.' },
                { letra: 'B', texto: 'El contenido generó interacción pero no cumplió su objetivo de llevar tráfico al sitio.' },
                { letra: 'C', texto: 'El sitio web tiene un problema.' },
                { letra: 'D', texto: 'Hay que publicar más contenido similar.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'La métrica importante depende del objetivo. Aquí el objetivo era tráfico, no likes.',
              peso: 15,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 07 — ASISTENTE ADMINISTRATIVO DIGITAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'asistente-administrativo-digital',
    titulo:       'Asistente Administrativo Digital',
    categoria:    'digitales',
    descripcion:  'Aprendé a organizar información, trabajar con planillas, gestionar documentos y usar herramientas digitales en un entorno laboral.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para colaborar en tareas administrativas digitales: cargar datos, organizar planillas, gestionar correos y documentos, y mantener la información actualizada.',
    competencias: [
      'Gestión administrativa digital',
      'Carga y control de datos',
      'Planillas',
      'Gestión documental',
      'Correo electrónico',
      'Organización de tareas',
      'Priorización',
      'Seguridad de la información',
      'Uso responsable de IA',
      'Precisión y responsabilidad',
    ],
    icono:  '📋',
    orden:  7,
    modulos: [

      {
        titulo: '¿Qué hace un asistente administrativo digital?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un asistente administrativo ayuda a que la información y las tareas de una organización estén ordenadas. Puede cargar datos, actualizar planillas, organizar documentos, gestionar correos, preparar información, registrar operaciones, organizar agendas y preparar reportes simples. No necesita conocimientos avanzados de informática — lo fundamental es trabajar de manera ordenada.',
          situacion: 'Una empresa necesita una persona para mantener actualizada una planilla con información de clientes.',
          pregunta: '¿Qué tarea corresponde a un asistente administrativo digital?',
          opciones: [
            { letra: 'A', texto: 'Registrar y actualizar la información siguiendo los criterios establecidos.' },
            { letra: 'B', texto: 'Cambiar los datos según lo que considere más conveniente.' },
            { letra: 'C', texto: 'Eliminar los registros antiguos sin consultar.' },
            { letra: 'D', texto: 'Dejar la planilla sin actualizar hasta fin de mes.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. Mantener información actualizada y ordenada es una tarea administrativa fundamental.',
          feedback_incorrecto: 'La tarea es registrar y actualizar siguiendo criterios establecidos, no cambiar según criterio propio.',
          competencias_criticas: ['Gestión administrativa digital'],
        },
      },

      {
        titulo: 'Trabajar con información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En administración, un dato incorrecto puede generar problemas. Es importante leer con atención, copiar correctamente, verificar, mantener formatos consistentes y detectar información faltante.',
          situacion: 'Estás cargando datos y encontrás que falta un número de teléfono.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Inventás un número para completar el registro.' },
            { letra: 'B', texto: 'Copiás el número de otro contacto.' },
            { letra: 'C', texto: 'Dejás constancia de que falta el dato y seguís el procedimiento para solicitarlo.' },
            { letra: 'D', texto: 'Eliminás el registro.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. Nunca hay que inventar información para completar una base de datos.',
          feedback_incorrecto: 'Cuando falta un dato, se deja constancia y se sigue el proceso para obtenerlo.',
          competencias_criticas: ['Carga y control de datos'],
        },
      },

      {
        titulo: 'Planillas',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Las planillas digitales permiten organizar información en filas y columnas. Pueden usarse para clientes, productos, ventas, gastos, turnos, tareas e inventarios. Herramientas comunes son Excel y Google Sheets. Una estructura ordenada facilita la búsqueda, clasificación y gestión de la información.',
          situacion: 'Tenés una planilla con nombres, teléfonos y correos de clientes.',
          pregunta: '¿Qué ventaja tiene mantener cada dato en su columna correspondiente?',
          opciones: [
            { letra: 'A', texto: 'Hace que la planilla tenga más colores.' },
            { letra: 'B', texto: 'Facilita ordenar, buscar y trabajar con la información.' },
            { letra: 'C', texto: 'Evita tener que revisar los datos.' },
            { letra: 'D', texto: 'Permite eliminar automáticamente los errores.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Exacto. Una estructura ordenada hace que la información sea fácil de usar.',
          feedback_incorrecto: 'Una estructura ordenada facilita buscar, ordenar y trabajar con los datos.',
          competencias_criticas: ['Planillas'],
        },
      },

      {
        titulo: 'Control de datos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de entregar una planilla hay que revisarla. Errores frecuentes: datos duplicados, números incorrectos, nombres mal escritos, filas incompletas, formatos diferentes o información desactualizada.',
          situacion: 'Terminaste de cargar 200 registros.',
          pregunta: '¿Qué conviene hacer antes de enviar la planilla?',
          opciones: [
            { letra: 'A', texto: 'Enviarla inmediatamente.' },
            { letra: 'B', texto: 'Revisar solamente los primeros cinco registros.' },
            { letra: 'C', texto: 'Cambiar el formato para que parezca más profesional.' },
            { letra: 'D', texto: 'Realizar controles para detectar errores o información incompleta.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Una revisión final detecta errores antes de que la información sea usada.',
          feedback_incorrecto: 'Hay que revisar todos los registros, no solo algunos.',
          competencias_criticas: ['Carga y control de datos'],
        },
      },

      {
        titulo: 'Correo electrónico',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El correo electrónico sigue siendo fundamental en muchos trabajos. Un correo laboral debe ser claro, concreto, respetuoso, correctamente dirigido y fácil de entender. También hay que prestar atención a los archivos adjuntos.',
          situacion: 'Tenés que enviar una planilla a un responsable.',
          pregunta: '¿Qué conviene revisar antes de enviar el correo?',
          opciones: [
            { letra: 'A', texto: 'Solamente el asunto.' },
            { letra: 'B', texto: 'Destinatario, asunto, mensaje y archivo adjunto.' },
            { letra: 'C', texto: 'Solamente el archivo.' },
            { letra: 'D', texto: 'Nada, porque el correo puede corregirse después.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Bien. Una revisión breve evita enviar al destinatario equivocado o sin el archivo.',
          feedback_incorrecto: 'Hay que revisar todo: destinatario, asunto, mensaje y adjunto.',
          competencias_criticas: ['Correo electrónico'],
        },
      },

      {
        titulo: 'Organización de tareas',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un asistente administrativo puede recibir varias tareas durante el día. Es útil organizar: tareas pendientes, prioridades, fechas límite, tareas terminadas y seguimientos.',
          situacion: 'Tenés cinco tareas pendientes y una tiene vencimiento hoy.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Elegís primero la tarea que te resulte más fácil.' },
            { letra: 'B', texto: 'Organizás las tareas considerando urgencia e importancia.' },
            { letra: 'C', texto: 'Hacés todas al mismo tiempo.' },
            { letra: 'D', texto: 'Esperás a que alguien te recuerde cuál hacer.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Priorizar permite cumplir plazos y evitar que tareas importantes queden pendientes.',
          feedback_incorrecto: 'Organizar por urgencia e importancia es clave para gestionar múltiples tareas.',
          competencias_criticas: ['Organización de tareas', 'Priorización'],
        },
      },

      {
        titulo: 'Documentos digitales',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En un trabajo administrativo podés recibir y crear distintos tipos de documentos: PDF, documentos de texto, planillas, presentaciones, formularios. Es importante identificar qué documento necesitás y dónde guardarlo correctamente.',
          situacion: 'Recibís una factura en PDF y necesitás guardarla para que otra persona del equipo pueda encontrarla.',
          pregunta: '¿Qué conviene hacer?',
          opciones: [
            { letra: 'A', texto: 'Guardarla con un nombre genérico como "archivo1".' },
            { letra: 'B', texto: 'Guardarla en tu computadora personal y no avisar.' },
            { letra: 'C', texto: 'Eliminarla después de leerla.' },
            { letra: 'D', texto: 'Guardarla en la ubicación correspondiente con un nombre claro siguiendo el criterio establecido.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Exacto. Una buena organización permite que otras personas encuentren la documentación rápidamente.',
          feedback_incorrecto: 'Los documentos deben guardarse con nombres claros en la ubicación correspondiente.',
          competencias_criticas: ['Gestión documental'],
        },
      },

      {
        titulo: 'Automatizar tareas con IA',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede ayudar en tareas administrativas: redactar correos, resumir documentos, ordenar información, generar borradores o crear fórmulas. Pero siempre hay que revisar el resultado antes de usarlo.',
          situacion: 'Necesitás redactar un correo profesional a partir de unas notas desordenadas.',
          pregunta: '¿Cómo podría ayudarte la IA?',
          opciones: [
            { letra: 'A', texto: 'Puede generar un borrador que después revisás y adaptás.' },
            { letra: 'B', texto: 'Puede enviarlo automáticamente sin que lo revises.' },
            { letra: 'C', texto: 'Puede decidir por vos qué información comunicar.' },
            { letra: 'D', texto: 'Puede reemplazar todas las tareas administrativas.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. La IA acelera tareas, pero la persona sigue siendo responsable de revisar y decidir.',
          feedback_incorrecto: 'La IA genera borradores; vos los revisás y usás lo que corresponde.',
          competencias_criticas: ['Uso responsable de IA'],
        },
      },

      {
        titulo: 'Privacidad y seguridad',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En tareas administrativas podés trabajar con información de clientes, empleados o proveedores. Hay que evitar compartir información sensible sin autorización. También importa proteger contraseñas, usar accesos autorizados y seguir las políticas de la organización.',
          situacion: 'Tenés que enviar una base de datos con información de clientes.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'La mandás a todos los contactos para asegurarte de que llegue.' },
            { letra: 'B', texto: 'La subís a cualquier sitio para compartirla fácilmente.' },
            { letra: 'C', texto: 'Verificás destinatario, permisos y procedimiento antes de compartirla.' },
            { letra: 'D', texto: 'Se la enviás a tu correo personal para trabajar desde casa.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. La información debe compartirse solo con personas autorizadas y por los canales correctos.',
          feedback_incorrecto: 'Verificar destinatario, permisos y procedimiento antes de compartir información sensible.',
          competencias_criticas: ['Seguridad de la información'],
        },
      },

      {
        titulo: 'Precisión y responsabilidad',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En un trabajo administrativo, ser rápido es útil pero ser preciso es fundamental. Una persona confiable cumple plazos, revisa su trabajo, comunica problemas, pregunta cuando tiene dudas y cuida la información.',
          situacion: 'Te das cuenta de que cometiste un error en una planilla que ya enviaste.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Esperás para ver si alguien lo descubre.' },
            { letra: 'B', texto: 'Avisás el error, corregís la información y enviás la versión correcta.' },
            { letra: 'C', texto: 'Eliminás el archivo anterior sin avisar.' },
            { letra: 'D', texto: 'Culpás a quien te entregó la información.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Reconocer y corregir un error demuestra responsabilidad profesional.',
          feedback_incorrecto: 'Reconocer errores y corregirlos es la actitud responsable.',
          competencias_criticas: ['Precisión y responsabilidad'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primer día como asistente administrativo',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Es tu primer día trabajando como asistente administrativo en una empresa de servicios. Tenés acceso a una planilla de clientes, al correo de la empresa y a la carpeta de documentos compartidos. Durante el día vas a enfrentar situaciones que pondrán a prueba lo que aprendiste.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Recibís una lista de 20 nuevos clientes con nombre, teléfono y correo para cargar en la planilla.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Cargás los datos respetando la estructura de la planilla y verificando que cada campo sea correcto.' },
                { letra: 'B', texto: 'Cargás rápido y después revisás.' },
                { letra: 'C', texto: 'Copiás los datos tal como llegaron sin verificar el formato.' },
                { letra: 'D', texto: 'Cargás solo los que tengan información completa.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Cargar bien desde el principio evita tener que corregir errores después.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'Al cargar un cliente, no encontrás su número de teléfono.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Ponés un número genérico para no dejar el campo vacío.' },
                { letra: 'B', texto: 'Copiás el teléfono del cliente anterior.' },
                { letra: 'C', texto: 'Eliminás el registro.' },
                { letra: 'D', texto: 'Dejás el campo vacío, registrás que falta el dato y seguís el procedimiento para solicitarlo.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Nunca inventar datos. Dejar constancia y seguir el proceso para obtenerlos.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'La planilla de ventas tiene fechas en distintos formatos, nombres con y sin mayúsculas, y montos con diferentes separadores.',
              pregunta:  '¿Qué hacés primero?',
              opciones: [
                { letra: 'A', texto: 'Aplicás un formato consistente a toda la información antes de trabajar con ella.' },
                { letra: 'B', texto: 'Trabajás con los datos como están.' },
                { letra: 'C', texto: 'Eliminás los registros con formato diferente.' },
                { letra: 'D', texto: 'Creás una nueva planilla desde cero.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Consistencia primero. Datos desordenados generan errores en el análisis.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Terminaste de cargar 150 registros. ¿Qué hacés?',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'La enviás directamente.' },
                { letra: 'B', texto: 'Revisás solo los últimos 10.' },
                { letra: 'C', texto: 'Realizás controles para detectar datos duplicados, faltantes o con formato incorrecto.' },
                { letra: 'D', texto: 'Esperás que otra persona encuentre los errores.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'El control final es parte del trabajo, no un extra. Detectar errores antes de entregar.',
              peso: 10,
            },
            {
              id:       'df_5',
              situacion: 'Tenés que enviar una planilla de ventas al responsable del área.',
              pregunta:  '¿Qué revisás antes de enviar?',
              opciones: [
                { letra: 'A', texto: 'Solamente que la planilla esté adjunta.' },
                { letra: 'B', texto: 'Destinatario, asunto, cuerpo del mensaje y archivo adjunto.' },
                { letra: 'C', texto: 'Solamente el asunto.' },
                { letra: 'D', texto: 'Nada porque es urgente.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Revisar todo antes de enviar evita errores que pueden tener consecuencias importantes.',
              peso: 10,
            },
            {
              id:       'df_6',
              situacion: 'Tenés que: actualizar una planilla que vence hoy, responder un mail de esta mañana y preparar un reporte para el viernes.',
              pregunta:  '¿Cómo organizás?',
              opciones: [
                { letra: 'A', texto: 'Hacés primero el reporte porque es el más largo.' },
                { letra: 'B', texto: 'Empezás con el mail porque llegó primero.' },
                { letra: 'C', texto: 'Priorizás según urgencia: primero la planilla que vence hoy, luego el mail, luego el reporte.' },
                { letra: 'D', texto: 'Esperás instrucciones antes de empezar.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Urgencia e importancia definen las prioridades. Lo que vence hoy, primero.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'Recibís una factura en PDF. ¿Cómo la guardás?',
              pregunta:  '¿Cómo la guardás?',
              opciones: [
                { letra: 'A', texto: 'La guardás en el escritorio con el nombre "Factura nueva".' },
                { letra: 'B', texto: 'La imprimís y la tirás.' },
                { letra: 'C', texto: 'La enviás a tu correo personal.' },
                { letra: 'D', texto: 'La guardás en la carpeta correspondiente con un nombre claro (ej: Factura_Proveedor_Fecha) siguiendo el criterio establecido.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Nombres claros y ubicación correcta permiten que cualquiera encuentre el documento.',
              peso: 10,
            },
            {
              id:       'df_8',
              situacion: 'Tenés notas de una reunión y tenés que redactar el acta formal. Usás IA para ayudarte.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Copiás las notas en la IA y enviás el resultado sin revisar.' },
                { letra: 'B', texto: 'Usás la IA para generar un borrador y después lo revisás y corregís según lo que pasó en la reunión.' },
                { letra: 'C', texto: 'Dejás que la IA decida qué información es importante.' },
                { letra: 'D', texto: 'Escribís el acta sola sin IA porque no confiás en ella.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'La IA acelera el trabajo, pero siempre revisás y corregís el resultado.',
              peso: 10,
            },
            {
              id:       'df_9',
              situacion: 'Un compañero te pide que le mandes la base de datos de clientes por WhatsApp.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Se la mandás porque es un compañero de trabajo.' },
                { letra: 'B', texto: 'Le mandás solo una parte.' },
                { letra: 'C', texto: 'Verificás si tiene autorización y si WhatsApp es el canal correcto para compartir esa información.' },
                { letra: 'D', texto: 'La mandás a tu propio WhatsApp para después reenviarla.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Antes de compartir información sensible: verificar autorización y canal correcto.',
              peso: 10,
            },
            {
              id:       'df_10',
              situacion: 'Descubrís que cargaste mal el precio de varios productos en la planilla que ya enviaste.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Esperás para ver si alguien lo nota.' },
                { letra: 'B', texto: 'Avisás el error, corregís la planilla y la enviás de nuevo con aclaración de los cambios.' },
                { letra: 'C', texto: 'Eliminás el archivo anterior sin avisar.' },
                { letra: 'D', texto: 'Decís que los datos llegaron mal.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Reconocer y corregir un error propio demuestra responsabilidad y genera confianza.',
              peso: 10,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 08 — CREADOR DE CONTENIDOS DIGITALES
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'creador-contenidos-digitales',
    titulo:       'Creador de Contenidos Digitales',
    categoria:    'digitales',
    descripcion:  'Aprendé a producir contenido digital para empresas: concepto, guion, grabación, edición y entrega.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para colaborar en la creación de contenidos digitales: definir el concepto, elegir el formato, escribir el guion, producirlo con herramientas digitales y usar IA como apoyo.',
    competencias: [
      'Creación de contenidos',
      'Desarrollo de conceptos',
      'Guion',
      'Producción audiovisual',
      'Edición',
      'Copywriting',
      'Uso de IA',
      'Creación de prompts',
      'Interpretación de briefs',
      'Comunicación digital',
      'Control de calidad',
    ],
    icono:  '🎬',
    orden:  8,
    modulos: [

      {
        titulo: '¿Qué hace un creador de contenidos?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un creador de contenidos produce materiales para comunicar algo en canales digitales: imágenes, videos, reels, historias, carruseles, textos, guiones, contenidos informativos o comerciales. El trabajo empieza antes de abrir una cámara o una aplicación — primero hay que entender qué se quiere comunicar y para quién.',
          situacion: 'Una cafetería quiere mostrar un nuevo producto en Instagram.',
          pregunta: '¿Qué debería hacer primero el creador de contenido?',
          opciones: [
            { letra: 'A', texto: 'Grabar cualquier video y publicarlo.' },
            { letra: 'B', texto: 'Pensar qué quiere comunicar y a quién está dirigido el contenido.' },
            { letra: 'C', texto: 'Buscar un video de otra cafetería.' },
            { letra: 'D', texto: 'Publicar solamente una fotografía del producto.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Antes de producir hay que definir el objetivo y el público.',
          feedback_incorrecto: 'Primero definir qué comunicar y para quién. Después producir.',
          competencias_criticas: ['Desarrollo de conceptos'],
        },
      },

      {
        titulo: 'De la idea al concepto',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una idea puede ser: "Hagamos un video sobre nuestro producto." Pero todavía no es un concepto. El concepto define qué queremos contar y desde qué enfoque — por ejemplo: "Mostrar cómo empieza el día de una persona con nuestro desayuno." Ese concepto después puede transformarse en un video, una historia o un reel.',
          situacion: 'Te piden crear contenido para promocionar una hamburguesa.',
          pregunta: '¿Cuál de estas opciones es un concepto más desarrollado?',
          opciones: [
            { letra: 'A', texto: '"Una hamburguesa."' },
            { letra: 'B', texto: '"Hacer un video."' },
            { letra: 'C', texto: '"Mostrar la hamburguesa."' },
            { letra: 'D', texto: '"Mostrar en un video corto el momento en que una persona abre la hamburguesa y descubre el producto, buscando generar ganas de probarla."' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. Un concepto indica qué se quiere mostrar y qué efecto se busca generar.',
          feedback_incorrecto: 'Un concepto dice qué mostrar, cómo y qué efecto debe provocar.',
          competencias_criticas: ['Desarrollo de conceptos'],
        },
      },

      {
        titulo: 'Elegir el formato',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'No todas las ideas funcionan igual en todos los formatos. Podés trabajar con video corto, imagen, carrusel, historia, texto o audio. La elección depende del contenido y del objetivo.',
          situacion: 'Querés explicar tres características diferentes de un producto.',
          pregunta: '¿Qué formato podría resultar útil?',
          opciones: [
            { letra: 'A', texto: 'Una publicación sin texto.' },
            { letra: 'B', texto: 'Un carrusel donde cada parte explique una característica.' },
            { letra: 'C', texto: 'Una fotografía sin información.' },
            { letra: 'D', texto: 'Un mensaje de una sola palabra.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. El formato debe ayudar a presentar la información de la manera más clara posible.',
          feedback_incorrecto: 'El formato debe estar al servicio del contenido que querés comunicar.',
          competencias_criticas: ['Creación de contenidos'],
        },
      },

      {
        titulo: 'Escribir un guion',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un video corto suele necesitar una estructura: inicio → desarrollo → cierre. El inicio capta la atención. El desarrollo presenta la idea. El cierre puede incluir una conclusión o llamado a la acción. Una estructura simple permite comunicar una idea completa en poco tiempo.',
          situacion: 'Tenés que hacer un video de 20 segundos para promocionar un curso.',
          pregunta: '¿Qué estructura sería más útil?',
          opciones: [
            { letra: 'A', texto: 'Presentar información sin orden.' },
            { letra: 'B', texto: 'Empezar con una explicación larga sobre la empresa.' },
            { letra: 'C', texto: 'Captar la atención, explicar brevemente el curso y terminar indicando cómo inscribirse.' },
            { letra: 'D', texto: 'Mostrar solamente el logo.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. Inicio que engancha, desarrollo claro, cierre con acción.',
          feedback_incorrecto: 'Un guion simple: captar atención, presentar la idea, cerrar con un llamado a la acción.',
          competencias_criticas: ['Guion'],
        },
      },

      {
        titulo: 'Producir con el celular',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Hoy muchas piezas digitales pueden producirse con un teléfono. Al grabar conviene cuidar: iluminación, encuadre, sonido, estabilidad, fondo y duración. No hace falta comenzar con equipamiento profesional.',
          situacion: 'Tenés que grabar un video para una empresa y el ambiente tiene mucho ruido.',
          pregunta: '¿Qué conviene hacer?',
          opciones: [
            { letra: 'A', texto: 'Grabar igual y esperar que el ruido no se note.' },
            { letra: 'B', texto: 'Hablar más fuerte.' },
            { letra: 'C', texto: 'Buscar un lugar más silencioso o mejorar la forma de registrar el audio.' },
            { letra: 'D', texto: 'Agregar música muy fuerte encima.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Correcto. El audio es fundamental para que un video pueda entenderse.',
          feedback_incorrecto: 'El audio importa tanto como la imagen. Hay que encontrar la solución antes de grabar.',
          competencias_criticas: ['Producción audiovisual'],
        },
      },

      {
        titulo: 'Editar un contenido',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La edición permite mejorar el material grabado con recortes, subtítulos, música, textos, transiciones y ajustes de duración. Editar no significa agregar efectos sin necesidad — la edición debe ayudar a comunicar mejor.',
          situacion: 'Un video tiene muchas transiciones y efectos que dificultan entender el mensaje.',
          pregunta: '¿Qué conviene hacer?',
          opciones: [
            { letra: 'A', texto: 'Agregar todavía más efectos.' },
            { letra: 'B', texto: 'Mantenerlos porque hacen que el video parezca profesional.' },
            { letra: 'C', texto: 'Eliminar todo el contenido.' },
            { letra: 'D', texto: 'Simplificar la edición y priorizar la claridad del mensaje.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. Una buena edición está al servicio del contenido, no al revés.',
          feedback_incorrecto: 'La edición debe ayudar al mensaje. Menos efectos, más claridad.',
          competencias_criticas: ['Edición'],
        },
      },

      {
        titulo: 'Crear con IA',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede ayudar en distintas etapas: generar ideas, desarrollar conceptos, crear guiones, proponer títulos, adaptar textos y generar variantes. Pero la herramienta necesita instrucciones claras.',
          situacion: 'Querés que una IA te ayude a desarrollar un guion.',
          pregunta: '¿Qué información sería útil darle?',
          opciones: [
            { letra: 'A', texto: 'Solamente "haceme un video".' },
            { letra: 'B', texto: 'Objetivo, público, tema, duración aproximada y tono.' },
            { letra: 'C', texto: 'Solamente el nombre de la empresa.' },
            { letra: 'D', texto: 'Una palabra.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. Cuanto más claro sea el contexto y el objetivo, más útil será el resultado.',
          feedback_incorrecto: 'Objetivo, público, tema, duración y tono dan el contexto necesario para un buen guion.',
          competencias_criticas: ['Creación de prompts', 'Uso de IA'],
        },
      },

      {
        titulo: 'Revisar el contenido generado por IA',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede producir información incorrecta o contenido que no representa bien a una marca. Por eso hay que revisar: datos, nombres, fechas, tono, imágenes, afirmaciones y coherencia.',
          situacion: 'La IA genera un dato sobre un producto que no coincide con la información de la empresa.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Verificás la información y corregís el contenido antes de utilizarlo.' },
            { letra: 'B', texto: 'Lo publicás porque lo generó la IA.' },
            { letra: 'C', texto: 'Cambiás el dato según lo que te parezca.' },
            { letra: 'D', texto: 'Eliminás toda la publicación.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Bien. La IA ayuda a producir, pero la información debe verificarse antes de publicar.',
          feedback_incorrecto: 'Siempre verificar los datos que genera la IA antes de usarlos.',
          competencias_criticas: ['Uso de IA', 'Control de calidad'],
        },
      },

      {
        titulo: 'Trabajar con un brief',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En un trabajo profesional podés recibir un brief con: objetivo, público, producto, mensaje, formato, fecha, tono y referencias. Aprender a interpretar un brief es una habilidad laboral importante.',
          situacion: 'El cliente te entrega un brief con indicaciones específicas.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Lo ignorás y hacés lo que te gusta.' },
            { letra: 'B', texto: 'Seguís solamente la mitad.' },
            { letra: 'C', texto: 'Copiás lo que hizo otra empresa.' },
            { letra: 'D', texto: 'Lo leés, identificás los objetivos y requisitos y producís el contenido en función de ellos.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Correcto. Trabajar con un brief significa transformar las necesidades del cliente en una pieza concreta.',
          feedback_incorrecto: 'El brief es la guía. Hay que leerlo, entenderlo y seguirlo.',
          competencias_criticas: ['Interpretación de briefs'],
        },
      },

      {
        titulo: 'Entregar un trabajo profesional',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de entregar un contenido hay que controlarlo: ortografía, imagen, audio, video, duración, formato, información, identidad de marca e instrucciones del brief.',
          situacion: 'Terminaste un reel para un cliente.',
          pregunta: '¿Qué hacés antes de entregarlo?',
          opciones: [
            { letra: 'A', texto: 'Lo enviás inmediatamente.' },
            { letra: 'B', texto: 'Lo revisás completo y verificás que cumpla con el brief.' },
            { letra: 'C', texto: 'Le pedís al cliente que encuentre los errores.' },
            { letra: 'D', texto: 'Solamente revisás la música.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Bien. Revisar antes de entregar demuestra profesionalismo y reduce errores.',
          feedback_incorrecto: 'Siempre revisar todo antes de entregar: imagen, audio, info y cumplimiento del brief.',
          competencias_criticas: ['Control de calidad'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primer contenido profesional',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Recibís tu primer encargo profesional. Una escuela de programación quiere que produzcas un reel de 20 segundos para Instagram anunciando sus nuevos cursos online. Te mandan un brief con esta info: Público: adultos 25-45 años que quieren cambiar de carrera. Objetivo: generar inscripciones. Tono: motivador y accesible. No prometer resultados garantizados.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Antes de arrancar, ¿cuál es el objetivo del contenido según el brief?',
              pregunta:  '¿Cuál es el objetivo?',
              opciones: [
                { letra: 'A', texto: 'Hacer contenido viral.' },
                { letra: 'B', texto: 'Generar conocimiento de los cursos y llevar potenciales interesados a inscribirse.' },
                { letra: 'C', texto: 'Ganar seguidores.' },
                { letra: 'D', texto: 'Publicar todos los días.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Identificar el objetivo antes de producir es el primer paso de todo contenido profesional.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'El brief dice que el público son adultos de 25-45 años que quieren cambiar de carrera.',
              pregunta:  '¿Qué tipo de mensaje es más adecuado para ese público?',
              opciones: [
                { letra: 'A', texto: 'Tecnicismos y términos avanzados de programación.' },
                { letra: 'B', texto: 'Lenguaje juvenil y referencias a memes.' },
                { letra: 'C', texto: 'Un mensaje técnico sobre algoritmos.' },
                { letra: 'D', texto: 'Un mensaje motivador y accesible que hable del cambio de carrera como algo posible.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'El mensaje debe resonar con el público. Para adultos que quieren cambiar, motivación y accesibilidad.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'La idea es "mostrar los cursos". ¿Cuál es un concepto más desarrollado?',
              pregunta:  '¿Cuál concepto es mejor?',
              opciones: [
                { letra: 'A', texto: '"Un video de los cursos."' },
                { letra: 'B', texto: '"Publicar el listado de cursos."' },
                { letra: 'C', texto: '"Mostrar en un video corto el antes y el después de una persona que cambió de trabajo gracias a los cursos."' },
                { letra: 'D', texto: '"Una imagen con el logo."' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Un concepto define qué mostrar y qué emoción generar, no solo qué cosa grabar.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Querés mostrar cómo es una clase por dentro: el ambiente, el docente y la dinámica.',
              pregunta:  '¿Qué formato funciona mejor?',
              opciones: [
                { letra: 'A', texto: 'Un video corto que muestre la clase en acción.' },
                { letra: 'B', texto: 'Una foto del aula vacía.' },
                { letra: 'C', texto: 'Un texto largo explicando la clase.' },
                { letra: 'D', texto: 'Un logo animado.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'El video captura el ambiente y la dinámica mejor que cualquier otro formato.',
              peso: 10,
            },
            {
              id:       'df_5',
              situacion: 'Tenés que estructurar el reel de 20 segundos.',
              pregunta:  '¿Qué estructura usás?',
              opciones: [
                { letra: 'A', texto: 'Hablar 20 segundos sin parar sobre todos los temas del curso.' },
                { letra: 'B', texto: 'Abrir con el logo, luego el nombre del curso, luego el precio.' },
                { letra: 'C', texto: 'Sin estructura, lo improvisás.' },
                { letra: 'D', texto: 'Inicio que capte atención + beneficio principal + llamado a la acción.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'En 20 segundos: enganchar, propuesta de valor, cierre con acción.',
              peso: 10,
            },
            {
              id:       'df_6',
              situacion: 'Vas a grabar en un aula pero hay eco y el sonido no es claro.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Grabás igual y ponés subtítulos.' },
                { letra: 'B', texto: 'Cambiás la ubicación o buscás una solución para el audio antes de grabar.' },
                { letra: 'C', texto: 'Grabás solo imagen sin audio.' },
                { letra: 'D', texto: 'Usás solo texto en pantalla.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'El audio es fundamental. Resolver el problema antes de grabar.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'Usás IA para generar ideas de reels. ¿Cuál es el mejor prompt?',
              pregunta:  '¿Cuál prompt es mejor?',
              opciones: [
                { letra: 'A', texto: '"Dame ideas de videos."' },
                { letra: 'B', texto: '"Propone contenido de cursos."' },
                { letra: 'C', texto: '"Proponé 5 ideas de reels de 20 segundos para una escuela de programación. Público: adultos que quieren cambiar de carrera. Objetivo: generar inscripciones. Tono: motivador y accesible. Sin prometer resultados garantizados."' },
                { letra: 'D', texto: '"Hacé reels sobre educación."' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Contexto completo + restricciones = resultado mucho más útil.',
              peso: 10,
            },
            {
              id:       'df_8',
              situacion: 'La IA generó el guion pero incluyó precios que no coinciden con los reales.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Verificás la información con el cliente y corregís antes de usar el guion.' },
                { letra: 'B', texto: 'Publicás igual porque el guion lo generó la IA.' },
                { letra: 'C', texto: 'Cambiás el precio según lo que te parece correcto.' },
                { letra: 'D', texto: 'Eliminás el guion y empezás de cero.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'La información debe verificarse siempre. La IA puede equivocarse.',
              peso: 10,
            },
            {
              id:       'df_9',
              situacion: 'El reel quedó con 5 transiciones diferentes en 20 segundos y se ve sobrecargado.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Agregás más transiciones para que sea más dinámico.' },
                { letra: 'B', texto: 'Lo publicás igual porque el cliente no sabe editar.' },
                { letra: 'C', texto: 'Lo eliminás completamente y empezás de cero.' },
                { letra: 'D', texto: 'Simplificás la edición: menos efectos, más claridad en el mensaje.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'La edición debe servir al mensaje. Menos es más cuando los efectos distraen.',
              peso: 10,
            },
            {
              id:       'df_10',
              situacion: 'Terminaste el reel. ¿Qué hacés antes de entregarlo?',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo enviás inmediatamente.' },
                { letra: 'B', texto: 'Lo revisás completo verificando que cumpla con el brief y que la información sea correcta.' },
                { letra: 'C', texto: 'Le pedís al cliente que revise y señale los errores.' },
                { letra: 'D', texto: 'Revisás solo el audio.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Revisar antes de entregar es parte del trabajo profesional. Brief + calidad + info correcta.',
              peso: 10,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 09 — ANALISTA DE DATOS INICIAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'analista-datos-inicial',
    titulo:       'Analista de Datos Inicial',
    categoria:    'digitales',
    descripcion:  'Aprendé a organizar, limpiar, analizar y presentar datos usando herramientas digitales.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para realizar tareas iniciales de análisis de datos: organizar información, detectar errores, calcular indicadores, comparar resultados y elaborar reportes básicos.',
    competencias: [
      'Análisis de datos',
      'Organización de información',
      'Limpieza de datos',
      'Detección de errores',
      'Indicadores básicos',
      'Comparación de resultados',
      'Visualización',
      'Identificación de patrones',
      'Reportes',
      'Uso responsable de IA',
    ],
    icono:  '📊',
    orden:  9,
    modulos: [

      {
        titulo: '¿Qué hace un analista de datos?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un analista de datos trabaja con información para encontrar patrones, diferencias y resultados que puedan ayudar a una organización. En un nivel inicial puede ordenar datos, limpiar información, comparar períodos, calcular indicadores, crear gráficos, detectar tendencias y elaborar reportes.',
          situacion: 'Una empresa tiene una planilla con las ventas de los últimos seis meses.',
          pregunta: '¿Qué podría hacer un analista de datos inicial?',
          opciones: [
            { letra: 'A', texto: 'Modificar los números para que el informe se vea mejor.' },
            { letra: 'B', texto: 'Ordenar y analizar la información para identificar resultados y tendencias.' },
            { letra: 'C', texto: 'Eliminar los meses con menores ventas.' },
            { letra: 'D', texto: 'Elegir solamente los datos positivos.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. El objetivo del análisis es comprender qué muestran los datos, no modificarlos.',
          feedback_incorrecto: 'Analizar significa entender los datos como son, no cambiarlos para que den bien.',
          competencias_criticas: ['Análisis de datos'],
        },
      },

      {
        titulo: 'Datos e información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un dato aislado no siempre dice mucho. "Se vendieron 500 unidades" — ¿en qué período? ¿Comparado con qué? ¿Fue más o menos que antes? Los datos adquieren significado cuando pueden analizarse dentro de un contexto.',
          situacion: 'Una empresa vendió 500 unidades este mes.',
          pregunta: '¿Qué información ayudaría a interpretar mejor ese número?',
          opciones: [
            { letra: 'A', texto: 'Compararlo con períodos anteriores o con el objetivo establecido.' },
            { letra: 'B', texto: 'Decir que 500 es un buen resultado.' },
            { letra: 'C', texto: 'Cambiar el número por un porcentaje.' },
            { letra: 'D', texto: 'Presentarlo sin contexto.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Bien. El contexto permite interpretar si 500 es mucho, poco o normal.',
          feedback_incorrecto: 'Los datos necesitan contexto para tener significado real.',
          competencias_criticas: ['Análisis de datos'],
        },
      },

      {
        titulo: 'Ordenar una base de datos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de analizar información hay que comprobar que esté organizada. Los datos deben estar estructurados de manera consistente — mismos formatos, mismos criterios, sin mezclar tipos de datos en una misma columna.',
          situacion: 'En una columna de fechas encontrás registros escritos de diferentes maneras.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Los dejás así porque igual se entienden.' },
            { letra: 'B', texto: 'Eliminás las fechas con formato diferente.' },
            { letra: 'C', texto: 'Aplicás un formato consistente y verificás que los datos sean correctos.' },
            { letra: 'D', texto: 'Cambiás todas las fechas por la fecha actual.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Correcto. La consistencia de los datos facilita el análisis y reduce errores.',
          feedback_incorrecto: 'Datos inconsistentes generan errores al analizar. Hay que estandarizar primero.',
          competencias_criticas: ['Limpieza de datos', 'Organización de información'],
        },
      },

      {
        titulo: 'Detectar errores',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una parte importante del análisis es encontrar problemas en los datos: valores duplicados, datos faltantes, números incorrectos, fechas imposibles, categorías inconsistentes. Cuando existe una inconsistencia hay que investigarla antes de sacar conclusiones.',
          situacion: 'Una planilla muestra que un producto tiene 500 unidades vendidas, pero el sistema registra solamente 50.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'Elegís el número mayor.' },
            { letra: 'B', texto: 'Elegís el número menor.' },
            { letra: 'C', texto: 'Promediás ambos valores.' },
            { letra: 'D', texto: 'Detectás la diferencia y verificás cuál es la fuente correcta antes de usar el dato.' },
          ],
          respuesta_correcta: 'D',
          feedback_correcto:   'Bien. Cuando hay inconsistencia, hay que investigarla antes de sacar conclusiones.',
          feedback_incorrecto: 'Ante datos contradictorios: investigar, no asumir ni promediar.',
          competencias_criticas: ['Detección de errores'],
        },
      },

      {
        titulo: 'Indicadores',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un indicador permite resumir información para facilitar su interpretación. Algunos indicadores básicos: total, promedio, porcentaje, crecimiento, variación, cantidad.',
          situacion: 'Una empresa quiere saber cuánto vendió en promedio por día durante una semana.',
          pregunta: '¿Qué indicador necesita calcular?',
          opciones: [
            { letra: 'A', texto: 'Total de empleados.' },
            { letra: 'B', texto: 'Promedio diario de ventas.' },
            { letra: 'C', texto: 'Cantidad de productos diferentes.' },
            { letra: 'D', texto: 'Cantidad de clientes registrados.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. El promedio diario divide el total por la cantidad de días del período.',
          feedback_incorrecto: 'Para saber el valor diario promedio, se calcula el promedio de ventas por día.',
          competencias_criticas: ['Indicadores básicos'],
        },
      },

      {
        titulo: 'Comparar resultados',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Comparar datos permite identificar cambios. Enero: 100 ventas. Febrero: 130 ventas. La cantidad aumentó. Además podemos calcular cuánto aumentó en términos porcentuales.',
          situacion: 'Una empresa pasó de 100 ventas a 120 ventas.',
          pregunta: '¿Qué conclusión básica podemos obtener?',
          opciones: [
            { letra: 'A', texto: 'Las ventas aumentaron un 20%.' },
            { letra: 'B', texto: 'Las ventas disminuyeron un 20%.' },
            { letra: 'C', texto: 'Las ventas se mantuvieron iguales.' },
            { letra: 'D', texto: 'No se puede comparar.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. El aumento fue de 20 sobre una base de 100, equivalente al 20%.',
          feedback_incorrecto: '20 unidades más sobre una base de 100 = 20% de crecimiento.',
          competencias_criticas: ['Comparación de resultados'],
        },
      },

      {
        titulo: 'Gráficos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Los gráficos ayudan a visualizar información. Tipos comunes: barras, líneas, tortas, columnas. El tipo de gráfico depende de lo que queremos mostrar.',
          situacion: 'Querés mostrar cómo evolucionaron las ventas durante los últimos doce meses.',
          pregunta: '¿Qué tipo de gráfico puede resultar especialmente útil?',
          opciones: [
            { letra: 'A', texto: 'Un gráfico de línea que permita observar la evolución en el tiempo.' },
            { letra: 'B', texto: 'Una imagen decorativa.' },
            { letra: 'C', texto: 'Una fotografía.' },
            { letra: 'D', texto: 'Un gráfico sin datos.' },
          ],
          respuesta_correcta: 'A',
          feedback_correcto:   'Correcto. Las líneas permiten visualizar la evolución de un indicador a lo largo del tiempo.',
          feedback_incorrecto: 'Para evolución en el tiempo, el gráfico de líneas es la herramienta estándar.',
          competencias_criticas: ['Visualización'],
        },
      },

      {
        titulo: 'Encontrar patrones',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Analizar datos no significa solamente calcular. También hay que observar. Podés encontrar: meses con mayor actividad, productos más vendidos, horarios de mayor demanda, diferencias entre zonas. Detectar patrones permite generar preguntas y obtener información útil para tomar decisiones.',
          situacion: 'Al analizar las ventas descubrís que todos los fines de semana aumentan considerablemente.',
          pregunta: '¿Qué podrías hacer?',
          opciones: [
            { letra: 'A', texto: 'Ignorar el patrón.' },
            { letra: 'B', texto: 'Eliminar los fines de semana de la información.' },
            { letra: 'C', texto: 'Señalar el comportamiento y analizarlo para comprender por qué ocurre.' },
            { letra: 'D', texto: 'Cambiar los números para confirmarlo.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. Detectar patrones genera preguntas e información útil para el negocio.',
          feedback_incorrecto: 'Los patrones son hallazgos valiosos. Hay que señalarlos y analizarlos.',
          competencias_criticas: ['Identificación de patrones'],
        },
      },

      {
        titulo: 'IA para analizar datos',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede ayudar a explicar una tabla, detectar posibles patrones, sugerir fórmulas, resumir resultados o generar ideas para un reporte. Pero los resultados deben revisarse — la IA puede equivocarse.',
          situacion: 'Le pedís a una IA que analice una planilla y te entrega una conclusión que parece incorrecta.',
          pregunta: '¿Qué hacés?',
          opciones: [
            { letra: 'A', texto: 'La presentás porque la IA hizo el análisis.' },
            { letra: 'B', texto: 'Verificás los datos y el razonamiento antes de utilizar la conclusión.' },
            { letra: 'C', texto: 'Eliminás la planilla.' },
            { letra: 'D', texto: 'Cambiás los datos para que coincidan con la conclusión.' },
          ],
          respuesta_correcta: 'B',
          feedback_correcto:   'Correcto. La IA puede ser una herramienta de análisis, pero no reemplaza la verificación.',
          feedback_incorrecto: 'Siempre verificar las conclusiones de la IA antes de presentarlas.',
          competencias_criticas: ['Uso responsable de IA'],
        },
      },

      {
        titulo: 'Presentar un reporte',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un análisis sirve cuando otra persona puede entenderlo. Un reporte básico debería mostrar: qué se analizó, qué datos se usaron, principales resultados, hallazgos y conclusiones. No hace falta llenarlo de gráficos — hay que mostrar lo que ayuda a entender el problema.',
          situacion: 'Tu jefe necesita saber qué pasó con las ventas este mes.',
          pregunta: '¿Qué reporte sería más útil?',
          opciones: [
            { letra: 'A', texto: 'Una planilla enorme sin explicación.' },
            { letra: 'B', texto: 'Todos los datos disponibles sin organizar.' },
            { letra: 'C', texto: 'Un resumen con indicadores principales, comparación con el período anterior y conclusiones relevantes.' },
            { letra: 'D', texto: 'Solamente una captura de pantalla.' },
          ],
          respuesta_correcta: 'C',
          feedback_correcto:   'Bien. Un buen reporte transforma los datos en información comprensible y útil.',
          feedback_incorrecto: 'El reporte debe ser claro, resumido y orientado a la toma de decisiones.',
          competencias_criticas: ['Reportes'],
        },
      },

      {
        titulo:           'Desafío Final — Tu primer análisis',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Te dan acceso a una base de datos de ventas de un negocio minorista. La planilla tiene 6 meses de información con columnas: fecha, producto, categoría, cantidad, precio unitario, vendedor, zona. Tu tarea es analizarla y preparar un reporte con los hallazgos principales.',
          tareas: [
            {
              id:       'df_1',
              situacion: 'Recibís la base de datos. ¿Qué hacés primero?',
              pregunta:  '¿Qué hacés primero?',
              opciones: [
                { letra: 'A', texto: 'Calculás el total de ventas.' },
                { letra: 'B', texto: 'Empezás a hacer gráficos.' },
                { letra: 'C', texto: 'Revisás que la información esté estructurada de forma consistente.' },
                { letra: 'D', texto: 'Eliminás los registros que parecen incorrectos.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Primero revisar la estructura. Datos desordenados generan análisis incorrectos.',
              peso: 10,
            },
            {
              id:       'df_2',
              situacion: 'Al revisar la planilla, varios registros no tienen fecha de venta.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Anotás que faltan datos y verificás la fuente antes de continuar.' },
                { letra: 'B', texto: 'Completás las fechas con la fecha de hoy.' },
                { letra: 'C', texto: 'Eliminás los registros sin fecha.' },
                { letra: 'D', texto: 'Ignorás los registros incompletos.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Datos faltantes deben registrarse y verificarse, no completarse arbitrariamente.',
              peso: 10,
            },
            {
              id:       'df_3',
              situacion: 'Un registro muestra ventas por $5.000.000 cuando el promedio es $50.000.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Lo incluís en el análisis sin cuestionar.' },
                { letra: 'B', texto: 'Lo cambiás por $50.000.' },
                { letra: 'C', texto: 'Investigás si es un error de carga, un caso especial o un dato real antes de incluirlo.' },
                { letra: 'D', texto: 'Eliminás el registro.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Un valor atípico puede ser un error o un caso real. Siempre investigar antes de decidir.',
              peso: 10,
            },
            {
              id:       'df_4',
              situacion: 'Querés identificar los 5 productos más vendidos.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Los adivinás mirando la planilla.' },
                { letra: 'B', texto: 'Le preguntás al encargado cuáles son.' },
                { letra: 'C', texto: 'Mirás los primeros 10 registros.' },
                { letra: 'D', texto: 'Ordenás la información por cantidad vendida de mayor a menor.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'Ordenar por la métrica relevante es la forma correcta de identificar los top 5.',
              peso: 10,
            },
            {
              id:       'df_5',
              situacion: 'El responsable quiere saber el promedio de ventas diarias del mes.',
              pregunta:  '¿Cómo lo calculás?',
              opciones: [
                { letra: 'A', texto: 'Dividís el total de ventas del mes por la cantidad de días del período.' },
                { letra: 'B', texto: 'Sumás las ventas de los mejores días.' },
                { letra: 'C', texto: 'Calculás el total sin dividir.' },
                { letra: 'D', texto: 'Tomás el número del día con más ventas.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Promedio = total / cantidad de días. Simple y correcto.',
              peso: 10,
            },
            {
              id:       'df_6',
              situacion: 'Este mes se vendieron 480 unidades. El mes pasado fueron 400.',
              pregunta:  '¿Cómo describís el resultado?',
              opciones: [
                { letra: 'A', texto: 'Las ventas disminuyeron.' },
                { letra: 'B', texto: 'Las ventas aumentaron un 20%.' },
                { letra: 'C', texto: 'Las ventas se mantuvieron igual.' },
                { letra: 'D', texto: 'No se puede comparar sin más información.' },
              ],
              respuesta_correcta: 'B',
              feedback: '80 unidades más sobre una base de 400 = 20% de crecimiento.',
              peso: 10,
            },
            {
              id:       'df_7',
              situacion: 'Querés mostrar la distribución de ventas por categoría: ropa, calzado, accesorios.',
              pregunta:  '¿Qué gráfico usás?',
              opciones: [
                { letra: 'A', texto: 'Un gráfico de barras o torta que muestre la proporción de cada categoría.' },
                { letra: 'B', texto: 'Un gráfico de líneas.' },
                { letra: 'C', texto: 'Una fotografía.' },
                { letra: 'D', texto: 'Una tabla sin gráfico.' },
              ],
              respuesta_correcta: 'A',
              feedback: 'Para distribución por categorías, barras o torta muestran las proporciones claramente.',
              peso: 10,
            },
            {
              id:       'df_8',
              situacion: 'Al revisar los datos notás que las ventas siempre bajan en enero y suben en diciembre.',
              pregunta:  '¿Qué hacés con esa información?',
              opciones: [
                { letra: 'A', texto: 'La ignorás porque es obvia.' },
                { letra: 'B', texto: 'La eliminás del análisis.' },
                { letra: 'C', texto: 'La incluís como hallazgo relevante y buscás una posible explicación.' },
                { letra: 'D', texto: 'Cambiás los datos para que sean más estables.' },
              ],
              respuesta_correcta: 'C',
              feedback: 'Los patrones estacionales son hallazgos importantes para el negocio. Hay que reportarlos.',
              peso: 10,
            },
            {
              id:       'df_9',
              situacion: 'Usás IA para analizar la tabla y te da una conclusión que contradice lo que ves en los datos.',
              pregunta:  '¿Qué hacés?',
              opciones: [
                { letra: 'A', texto: 'Presentás la conclusión de la IA.' },
                { letra: 'B', texto: 'Ignorás la IA.' },
                { letra: 'C', texto: 'Eliminás la tabla.' },
                { letra: 'D', texto: 'Verificás el análisis revisando los datos directamente antes de usar la conclusión.' },
              ],
              respuesta_correcta: 'D',
              feedback: 'La IA puede equivocarse. Siempre verificar con los datos reales.',
              peso: 10,
            },
            {
              id:       'df_10',
              situacion: 'Terminaste el análisis. ¿Cómo presentás los resultados?',
              pregunta:  '¿Cómo presentás?',
              opciones: [
                { letra: 'A', texto: 'Mostrás toda la base de datos.' },
                { letra: 'B', texto: 'Presentás un resumen con indicadores principales, comparación con el período anterior y hallazgos relevantes.' },
                { letra: 'C', texto: 'Enviás solo los gráficos.' },
                { letra: 'D', texto: 'Hacés una presentación de 50 diapositivas.' },
              ],
              respuesta_correcta: 'B',
              feedback: 'Un reporte claro y conciso es más útil que volcar todos los datos.',
              peso: 10,
            },
          ],
        },
      },

    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10 — ASISTENTE DE IA
  // ══════════════════════════════════════════════════════════════════════════
  {
    slug:         'asistente-ia',
    titulo:       'Asistente de IA',
    categoria:    'digitales',
    descripcion:  'Aprendé a usar herramientas de inteligencia artificial para resolver tareas laborales con criterio profesional.',
    nivel:        'inicial',
    duracion_min: 48,
    objetivo:     'Prepararte para usar herramientas de IA en el trabajo: definir tareas, crear prompts claros, iterar resultados, verificar información y proteger la privacidad.',
    competencias: [
      'Inteligencia artificial aplicada',
      'Creación de prompts',
      'Redacción de instrucciones',
      'Uso de contexto',
      'Iteración de resultados',
      'Transformación de información',
      'Verificación de información',
      'Organización digital',
      'Uso responsable de IA',
      'Protección de información',
      'Criterio profesional',
    ],
    icono:  '🤖',
    orden:  10,
    modulos: [

      {
        titulo: '¿Qué hace un asistente de IA?',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Un asistente de IA utiliza herramientas de inteligencia artificial para ayudar a resolver tareas concretas: redacción, organización de información, generación de ideas, resumen de documentos, preparación de textos, clasificación de información, análisis básico. La IA es una herramienta de apoyo — la persona sigue siendo responsable del trabajo.',
          situacion: 'Una empresa necesita transformar unas notas desordenadas en un informe.',
          pregunta: '¿Qué podría hacer un asistente de IA?',
          opciones: [
            'Entregar las notas directamente al cliente.',
            'Utilizar IA para organizar la información y generar un primer borrador, y luego revisar el resultado.',
            'Pedirle a la IA que tome todas las decisiones.',
            'Copiar las notas sin modificarlas.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:   'Bien. La IA acelera una tarea, pero el resultado debe revisarse antes de usarse.',
          feedback_incorrecto: 'Usar IA + revisar el resultado = la combinación correcta.',
          competencia: 'Uso responsable de IA',
        },
      },

      {
        titulo: 'Definir la tarea',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Antes de usar IA hay que saber qué necesitás obtener. Preguntate: ¿Qué quiero lograr? ¿Para quién es? ¿Qué información tengo? ¿Cómo necesito recibir el resultado? Definir el resultado esperado permite darle a la IA una instrucción mucho más precisa.',
          situacion: 'Tenés las notas de una reunión y necesitás preparar un resumen para tu equipo.',
          pregunta: '¿Qué conviene definir?',
          opciones: [
            'Solamente que querés "un resumen".',
            'Qué información debe incluir, para quién es y qué formato necesitás.',
            'Qué colores querés utilizar.',
            'Cuántos emojis debe tener.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:   'Correcto. Definir el resultado esperado permite instrucciones más precisas.',
          feedback_incorrecto: 'Qué incluir, para quién y en qué formato son las definiciones clave.',
          competencia: 'Creación de prompts',
        },
      },

      {
        titulo: 'Aprender a dar instrucciones',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA responde a las instrucciones que recibe. Una instrucción demasiado general produce un resultado poco útil. Un buen pedido puede incluir: contexto + tarea + objetivo + formato + condiciones.',
          situacion: 'Querés transformar una lista de tareas en una tabla.',
          pregunta: '¿Cuál instrucción es más precisa?',
          opciones: [
            '"Ordená esto."',
            '"Hacelo prolijo."',
            '"Convertí esta lista en una tabla con tarea, responsable, fecha límite y estado. No inventes datos faltantes."',
            '"Arreglá todo."',
          ],
          respuesta_correcta: 2,
          feedback_correcto:   'Bien. Una buena instrucción explica qué hacer, cómo presentarlo y qué límites respetar.',
          feedback_incorrecto: 'Especificar la tarea, el formato y las condiciones produce resultados mucho más útiles.',
          competencia: 'Redacción de instrucciones',
        },
      },

      {
        titulo: 'El prompt',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El prompt es la instrucción que le damos a una herramienta de IA. Lo importante es que permita entender: qué necesitás, qué información debe utilizar, qué resultado esperás y qué condiciones debe respetar.',
          situacion: 'Querés que la IA escriba una publicación para una cafetería.',
          pregunta: '¿Cuál pedido tiene más información útil?',
          opciones: [
            '"Escribí algo para Instagram."',
            '"Hacé una publicación linda."',
            '"Escribí un post."',
            '"Escribí una publicación para Instagram de una cafetería de barrio que presenta un nuevo desayuno. Público: jóvenes y adultos. Objetivo: generar visitas al local. Tono: cercano y simple. Terminá con una invitación a conocerlo."',
          ],
          respuesta_correcta: 3,
          feedback_correcto:   'Correcto. Contexto, público, objetivo y tono producen resultados mucho más adecuados.',
          feedback_incorrecto: 'Cuanto más contexto y objetivos incluís, más útil es la respuesta.',
          competencia: 'Creación de prompts',
        },
      },

      {
        titulo: 'Dar contexto',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA no conoce automáticamente tu situación de trabajo. Cuanto más relevante sea el contexto, más fácil será orientar el resultado. Podés indicar: qué hace la empresa, quién es el público, cuál es el objetivo, qué información debe usar y qué tono necesitás.',
          situacion: 'Necesitás responder una consulta de un cliente sobre un producto.',
          pregunta: '¿Qué información ayudaría a la IA?',
          opciones: [
            'Solamente el nombre de la empresa.',
            'El mensaje del cliente, la información disponible sobre el producto y el objetivo de la respuesta.',
            'Solamente "respondé profesionalmente".',
            'Una palabra relacionada con el producto.',
          ],
          respuesta_correcta: 1,
          feedback_correcto:   'Bien. La IA necesita contexto suficiente para producir una respuesta adecuada.',
          feedback_incorrecto: 'Mensaje del cliente + info del producto + objetivo = contexto útil para la IA.',
          competencia: 'Uso de contexto',
        },
      },

      {
        titulo: 'Mejorar el resultado',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'El primer resultado no siempre es el definitivo. Podés pedirle a la IA que reduzca el texto, cambie el tono, ordene la información, elimine repeticiones, agregue ejemplos, use lenguaje más simple o adapte el contenido. Esto se llama iterar.',
          situacion: 'La IA generó un texto demasiado largo para enviar por WhatsApp.',
          pregunta: '¿Qué hacés?',
          opciones: [
            'Lo enviás igual.',
            'Abandonás la tarea.',
            'Le pedís que lo reduzca, indicando la extensión y el tono que necesitás.',
            'Copiás solamente la primera oración.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:   'Correcto. Podés mejorar progresivamente el resultado mediante nuevas instrucciones.',
          feedback_incorrecto: 'Iterar: pedirle mejoras específicas al resultado hasta que sea el que necesitás.',
          competencia: 'Iteración de resultados',
        },
      },

      {
        titulo: 'Verificar la información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La IA puede cometer errores. Puede generar información incorrecta, incompleta, desactualizada o inventada. Por eso nunca hay que asumir que una respuesta es verdadera simplemente porque la produjo una IA.',
          situacion: 'La IA te da un dato que necesitás colocar en un documento importante.',
          pregunta: '¿Qué hacés?',
          opciones: [
            'Lo copiás directamente.',
            'Le preguntás a la IA si está segura.',
            'Lo verificás utilizando una fuente confiable antes de incorporarlo.',
            'Lo presentás como verdadero porque parece razonable.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:   'Bien. La información importante debe verificarse con fuentes confiables.',
          feedback_incorrecto: 'La IA puede equivocarse. Siempre verificar datos importantes con la fuente.',
          competencia: 'Verificación de información',
        },
      },

      {
        titulo: 'Transformar información',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'Una de las aplicaciones más útiles de la IA es transformar información existente: notas → resumen, texto → puntos principales, lista → tabla, información → borrador, documento → síntesis.',
          situacion: 'Tenés un documento extenso y necesitás identificar rápidamente los principales puntos.',
          pregunta: '¿Qué puede hacer la IA?',
          opciones: [
            'Resumir y organizar la información para facilitar su revisión.',
            'Decidir automáticamente qué información es verdadera.',
            'Eliminar todo lo que considere poco importante sin instrucciones.',
            'Reemplazar completamente tu revisión.',
          ],
          respuesta_correcta: 0,
          feedback_correcto:   'Correcto. La IA ayuda a procesar y organizar, pero vos controlás el resultado.',
          feedback_incorrecto: 'La IA procesa y organiza. La revisión y decisión final sigue siendo tuya.',
          competencia: 'Transformación de información',
        },
      },

      {
        titulo: 'Información confidencial',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'En un trabajo podés tener acceso a información de clientes, empleados o empresas. No toda información puede introducirse libremente en una herramienta de IA. Antes hay que considerar: qué información contiene, si es confidencial, qué políticas tiene la organización y qué herramientas están autorizadas.',
          situacion: 'Tenés una base de datos con información personal de clientes y querés usar IA para organizarla.',
          pregunta: '¿Qué hacés?',
          opciones: [
            'Copiás toda la base en cualquier herramienta.',
            'La enviás a tu correo personal.',
            'Verificás las políticas y usás solo herramientas autorizadas, evitando exponer información innecesariamente.',
            'Se la compartís a otra persona para que la organice.',
          ],
          respuesta_correcta: 2,
          feedback_correcto:   'Correcto. Trabajar con IA implica proteger la información y respetar las políticas de la organización.',
          feedback_incorrecto: 'La privacidad de los datos es una responsabilidad laboral, también al usar IA.',
          competencia: 'Protección de información',
        },
      },

      {
        titulo: 'Criterio profesional',
        tipo:   'pregunta',
        contenido: {
          texto_educativo: 'La habilidad más importante no es escribir muchos prompts. Es saber: qué pedir, cuándo usar IA, cómo controlar el resultado y cuándo no confiar automáticamente en él. La persona define → pide → revisa → corrige → decide.',
          situacion: 'La IA genera un resultado que contradice una información oficial de la empresa.',
          pregunta: '¿Qué hacés?',
          opciones: [
            'Elegís la respuesta de la IA.',
            'Publicás las dos versiones.',
            'Cambiás la información oficial.',
            'Verificás la información y usás la fuente autorizada.',
          ],
          respuesta_correcta: 3,
          feedback_correcto:   'Bien. La IA es una herramienta de apoyo. Las fuentes oficiales y el criterio profesional tienen prioridad.',
          feedback_incorrecto: 'Las fuentes oficiales siempre tienen prioridad sobre lo que genera la IA.',
          competencia: 'Criterio profesional',
        },
      },

      {
        titulo:           'Desafío Final — Resolvé una tarea real con IA',
        tipo:             'desafio_final',
        es_desafio_final: true,
        contenido: {
          escenario: 'Tu jefe te pide preparar para mañana un resumen comparativo de tres propuestas recibidas de distintos proveedores, para una presentación ante el equipo de dirección. Tenés los tres documentos, pero uno incluye información confidencial de costos internos.',
          tareas: [
            {
              titulo:      '¿Qué definís primero?',
              descripcion: 'Antes de empezar, ¿qué definís?',
              opciones: [
                'Qué información contienen las propuestas, qué debe incluir el resumen y para quién es.',
                'Qué colores usar en la presentación.',
                'Cuántas páginas tiene cada propuesta.',
                'Si la IA puede hacer toda la tarea sola.',
              ],
              respuesta_correcta: 0,
              competencia: 'Criterio profesional',
              feedback: 'Definir objetivo, contenido y audiencia antes de usar IA es el primer paso.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés con la información confidencial?',
              descripcion: 'Una de las propuestas contiene información confidencial de costos internos.',
              opciones: [
                'Cargás los tres PDFs directamente en cualquier herramienta de IA.',
                'Cargás todos y después borrás lo que no querés.',
                'Verificás qué información puede compartirse según las políticas de la empresa antes de introducirla en la IA.',
                'Usás solo la propuesta sin información confidencial y listo.',
              ],
              respuesta_correcta: 2,
              competencia: 'Protección de información',
              feedback: 'Antes de introducir información en una IA, verificar si es confidencial y qué dice la política.',
              peso: 10,
            },
            {
              titulo:      '¿Cuál prompt es más preciso?',
              descripcion: 'Necesitás que la IA resuma las tres propuestas para comparar sus puntos clave.',
              opciones: [
                '"Resumí esto."',
                '"Hacé un resumen."',
                '"Analizá."',
                '"Resumí estas tres propuestas en una tabla comparativa con: nombre de la propuesta, objetivo, costos estimados y puntos fuertes. Máximo tres líneas por propuesta."',
              ],
              respuesta_correcta: 3,
              competencia: 'Creación de prompts',
              feedback: 'Formato específico + límites claros = resultado mucho más útil.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés si el resultado es muy técnico?',
              descripcion: 'La IA devolvió un resumen muy técnico para una audiencia no especializada.',
              opciones: [
                'Lo usás igual porque la IA lo generó.',
                'Lo descartás completamente.',
                'Le pedís que lo reformule con lenguaje más simple para una audiencia no técnica.',
                'Cambiás algunas palabras vos mismo sin pedir más.',
              ],
              respuesta_correcta: 2,
              competencia: 'Iteración de resultados',
              feedback: 'Iterar con una instrucción clara es más eficiente que corregir manualmente.',
              peso: 10,
            },
            {
              titulo:      '¿Qué le pedís cuando mezcla información?',
              descripcion: 'El resumen mezcla información de las tres propuestas sin diferenciarlas.',
              opciones: [
                'Que sea más breve.',
                'Que identifique y separe claramente la información de cada propuesta.',
                'Que use emojis para separar.',
                'Que lo convierta en imágenes.',
              ],
              respuesta_correcta: 1,
              competencia: 'Iteración de resultados',
              feedback: 'Instrucción específica sobre el problema que detectaste = iteración efectiva.',
              peso: 10,
            },
            {
              titulo:      '¿Cuál instrucción de seguimiento es mejor?',
              descripcion: 'Querés que cada propuesta tenga su propia sección con ventajas y desventajas.',
              opciones: [
                '"Mejor."',
                '"Hacelo distinto."',
                '"Presentá cada propuesta en una sección separada con título, ventajas y desventajas en bullets."',
                '"Modificá todo."',
              ],
              respuesta_correcta: 2,
              competencia: 'Redacción de instrucciones',
              feedback: 'Una instrucción específica y estructurada produce el resultado que necesitás.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés si hay un dato incorrecto?',
              descripcion: 'La IA menciona que una propuesta ofrece 6 meses de garantía, pero el documento original dice 3.',
              opciones: [
                'Usás el dato de la IA.',
                'Promediás: 4,5 meses.',
                'Eliminás la sección de garantía.',
                'Verificás con el documento original y corregís el dato.',
              ],
              respuesta_correcta: 3,
              competencia: 'Verificación de información',
              feedback: 'La IA puede equivocarse. El documento original es la fuente de verdad.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés si el resumen no cabe en una diapositiva?',
              descripcion: 'La presentación final debe caber en una sola diapositiva. El resumen tiene 4 páginas.',
              opciones: [
                'Le pedís a la IA que lo condense en un formato breve para una sola diapositiva con los puntos más importantes.',
                'Enviás las 4 páginas igual.',
                'Lo eliminás y hacés la diapositiva sin IA.',
                'Le preguntás a alguien más.',
              ],
              respuesta_correcta: 0,
              competencia: 'Iteración de resultados',
              feedback: 'Iterar con el formato correcto es parte del proceso. La IA puede adaptarlo.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés si el resultado expone datos confidenciales?',
              descripcion: 'El resultado final incluye el nombre y el precio de un proveedor. Esa información era confidencial.',
              opciones: [
                'Lo enviás igual porque ya estaba en el documento original.',
                'Avisás que el documento tiene información confidencial y eliminás esos datos antes de compartirlo.',
                'Solo lo compartís internamente.',
                'Le pedís permiso al proveedor.',
              ],
              respuesta_correcta: 1,
              competencia: 'Protección de información',
              feedback: 'Proteger información confidencial es una responsabilidad laboral. Hay que detectarla y eliminarla antes de compartir.',
              peso: 10,
            },
            {
              titulo:      '¿Qué hacés antes de entregar el resumen final?',
              descripcion: 'El resumen final está listo.',
              opciones: [
                'Lo enviás inmediatamente.',
                'Revisás que la información sea correcta, el formato sea el pedido y no incluya datos confidenciales.',
                'Le pedís a la IA que lo revise.',
                'Lo enviás sin leer porque ya lo viste antes.',
              ],
              respuesta_correcta: 1,
              competencia: 'Criterio profesional',
              feedback: 'Revisión final: info correcta + formato adecuado + sin datos confidenciales. Siempre.',
              peso: 10,
            },
          ],
        },
      },

    ],
  },

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
