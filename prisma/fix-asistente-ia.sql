-- Fix asistente-ia módulos: opciones como strings planos + respuesta_correcta como número
-- Correr en: Supabase > SQL Editor

DO $$
DECLARE
  cap_id UUID;
BEGIN
  SELECT id INTO cap_id FROM "CapacitateContenido" WHERE slug = 'asistente-ia';

  -- Módulo 1: ¿Qué hace un asistente de IA?
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "Un asistente de IA utiliza herramientas de inteligencia artificial para ayudar a resolver tareas concretas: redacción, organización de información, generación de ideas, resumen de documentos, preparación de textos, clasificación de información, análisis básico. La IA es una herramienta de apoyo — la persona sigue siendo responsable del trabajo.",
    "situacion": "Una empresa necesita transformar unas notas desordenadas en un informe.",
    "pregunta": "¿Qué podría hacer un asistente de IA?",
    "opciones": [
      "Entregar las notas directamente al cliente.",
      "Utilizar IA para organizar la información y generar un primer borrador, y luego revisar el resultado.",
      "Pedirle a la IA que tome todas las decisiones.",
      "Copiar las notas sin modificarlas."
    ],
    "respuesta_correcta": 1,
    "feedback_correcto": "Bien. La IA acelera una tarea, pero el resultado debe revisarse antes de usarse.",
    "feedback_incorrecto": "Usar IA + revisar el resultado = la combinación correcta.",
    "competencia": "Uso responsable de IA"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 1;

  -- Módulo 2: Definir la tarea
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "Antes de usar IA hay que saber qué necesitás obtener. Preguntate: ¿Qué quiero lograr? ¿Para quién es? ¿Qué información tengo? ¿Cómo necesito recibir el resultado? Definir el resultado esperado permite darle a la IA una instrucción mucho más precisa.",
    "situacion": "Tenés las notas de una reunión y necesitás preparar un resumen para tu equipo.",
    "pregunta": "¿Qué conviene definir?",
    "opciones": [
      "Solamente que querés \"un resumen\".",
      "Qué información debe incluir, para quién es y qué formato necesitás.",
      "Qué colores querés utilizar.",
      "Cuántos emojis debe tener."
    ],
    "respuesta_correcta": 1,
    "feedback_correcto": "Correcto. Definir el resultado esperado permite instrucciones más precisas.",
    "feedback_incorrecto": "Qué incluir, para quién y en qué formato son las definiciones clave.",
    "competencia": "Creación de prompts"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 2;

  -- Módulo 3: Aprender a dar instrucciones
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "La IA responde a las instrucciones que recibe. Una instrucción demasiado general produce un resultado poco útil. Un buen pedido puede incluir: contexto + tarea + objetivo + formato + condiciones.",
    "situacion": "Querés transformar una lista de tareas en una tabla.",
    "pregunta": "¿Cuál instrucción es más precisa?",
    "opciones": [
      "\"Ordená esto.\"",
      "\"Hacelo prolijo.\"",
      "\"Convertí esta lista en una tabla con tarea, responsable, fecha límite y estado. No inventes datos faltantes.\"",
      "\"Arreglá todo.\""
    ],
    "respuesta_correcta": 2,
    "feedback_correcto": "Bien. Una buena instrucción explica qué hacer, cómo presentarlo y qué límites respetar.",
    "feedback_incorrecto": "Especificar la tarea, el formato y las condiciones produce resultados mucho más útiles.",
    "competencia": "Redacción de instrucciones"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 3;

  -- Módulo 4: El prompt
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "El prompt es la instrucción que le damos a una herramienta de IA. Lo importante es que permita entender: qué necesitás, qué información debe utilizar, qué resultado esperás y qué condiciones debe respetar.",
    "situacion": "Querés que la IA escriba una publicación para una cafetería.",
    "pregunta": "¿Cuál pedido tiene más información útil?",
    "opciones": [
      "\"Escribí algo para Instagram.\"",
      "\"Hacé una publicación linda.\"",
      "\"Escribí un post.\"",
      "\"Escribí una publicación para Instagram de una cafetería de barrio que presenta un nuevo desayuno. Público: jóvenes y adultos. Objetivo: generar visitas al local. Tono: cercano y simple. Terminá con una invitación a conocerlo.\""
    ],
    "respuesta_correcta": 3,
    "feedback_correcto": "Correcto. Contexto, público, objetivo y tono producen resultados mucho más adecuados.",
    "feedback_incorrecto": "Cuanto más contexto y objetivos incluís, más útil es la respuesta.",
    "competencia": "Creación de prompts"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 4;

  -- Módulo 5: Dar contexto
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "La IA no conoce automáticamente tu situación de trabajo. Cuanto más relevante sea el contexto, más fácil será orientar el resultado. Podés indicar: qué hace la empresa, quién es el público, cuál es el objetivo, qué información debe usar y qué tono necesitás.",
    "situacion": "Necesitás responder una consulta de un cliente sobre un producto.",
    "pregunta": "¿Qué información ayudaría a la IA?",
    "opciones": [
      "Solamente el nombre de la empresa.",
      "El mensaje del cliente, la información disponible sobre el producto y el objetivo de la respuesta.",
      "Solamente \"respondé profesionalmente\".",
      "Una palabra relacionada con el producto."
    ],
    "respuesta_correcta": 1,
    "feedback_correcto": "Bien. La IA necesita contexto suficiente para producir una respuesta adecuada.",
    "feedback_incorrecto": "Mensaje del cliente + info del producto + objetivo = contexto útil para la IA.",
    "competencia": "Uso de contexto"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 5;

  -- Módulo 6: Mejorar el resultado
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "El primer resultado no siempre es el definitivo. Podés pedirle a la IA que reduzca el texto, cambie el tono, ordene la información, elimine repeticiones, agregue ejemplos, use lenguaje más simple o adapte el contenido. Esto se llama iterar.",
    "situacion": "La IA generó un texto demasiado largo para enviar por WhatsApp.",
    "pregunta": "¿Qué hacés?",
    "opciones": [
      "Lo enviás igual.",
      "Abandonás la tarea.",
      "Le pedís que lo reduzca, indicando la extensión y el tono que necesitás.",
      "Copiás solamente la primera oración."
    ],
    "respuesta_correcta": 2,
    "feedback_correcto": "Correcto. Podés mejorar progresivamente el resultado mediante nuevas instrucciones.",
    "feedback_incorrecto": "Iterar: pedirle mejoras específicas al resultado hasta que sea el que necesitás.",
    "competencia": "Iteración de resultados"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 6;

  -- Módulo 7: Verificar la información
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "La IA puede cometer errores. Puede generar información incorrecta, incompleta, desactualizada o inventada. Por eso nunca hay que asumir que una respuesta es verdadera simplemente porque la produjo una IA.",
    "situacion": "La IA te da un dato que necesitás colocar en un documento importante.",
    "pregunta": "¿Qué hacés?",
    "opciones": [
      "Lo copiás directamente.",
      "Le preguntás a la IA si está segura.",
      "Lo verificás utilizando una fuente confiable antes de incorporarlo.",
      "Lo presentás como verdadero porque parece razonable."
    ],
    "respuesta_correcta": 2,
    "feedback_correcto": "Bien. La información importante debe verificarse con fuentes confiables.",
    "feedback_incorrecto": "La IA puede equivocarse. Siempre verificar datos importantes con la fuente.",
    "competencia": "Verificación de información"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 7;

  -- Módulo 8: Transformar información
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "Una de las aplicaciones más útiles de la IA es transformar información existente: notas → resumen, texto → puntos principales, lista → tabla, información → borrador, documento → síntesis.",
    "situacion": "Tenés un documento extenso y necesitás identificar rápidamente los principales puntos.",
    "pregunta": "¿Qué puede hacer la IA?",
    "opciones": [
      "Resumir y organizar la información para facilitar su revisión.",
      "Decidir automáticamente qué información es verdadera.",
      "Eliminar todo lo que considere poco importante sin instrucciones.",
      "Reemplazar completamente tu revisión."
    ],
    "respuesta_correcta": 0,
    "feedback_correcto": "Correcto. La IA ayuda a procesar y organizar, pero vos controlás el resultado.",
    "feedback_incorrecto": "La IA procesa y organiza. La revisión y decisión final sigue siendo tuya.",
    "competencia": "Transformación de información"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 8;

  -- Módulo 9: Información confidencial
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "En un trabajo podés tener acceso a información de clientes, empleados o empresas. No toda información puede introducirse libremente en una herramienta de IA. Antes hay que considerar: qué información contiene, si es confidencial, qué políticas tiene la organización y qué herramientas están autorizadas.",
    "situacion": "Tenés una base de datos con información personal de clientes y querés usar IA para organizarla.",
    "pregunta": "¿Qué hacés?",
    "opciones": [
      "Copiás toda la base en cualquier herramienta.",
      "La enviás a tu correo personal.",
      "Verificás las políticas y usás solo herramientas autorizadas, evitando exponer información innecesariamente.",
      "Se la compartís a otra persona para que la organice."
    ],
    "respuesta_correcta": 2,
    "feedback_correcto": "Correcto. Trabajar con IA implica proteger la información y respetar las políticas de la organización.",
    "feedback_incorrecto": "La privacidad de los datos es una responsabilidad laboral, también al usar IA.",
    "competencia": "Protección de información"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 9;

  -- Módulo 10: Criterio profesional
  UPDATE "CapacitateModulo" SET contenido = '{
    "texto_educativo": "La habilidad más importante no es escribir muchos prompts. Es saber: qué pedir, cuándo usar IA, cómo controlar el resultado y cuándo no confiar automáticamente en él. La persona define → pide → revisa → corrige → decide.",
    "situacion": "La IA genera un resultado que contradice una información oficial de la empresa.",
    "pregunta": "¿Qué hacés?",
    "opciones": [
      "Elegís la respuesta de la IA.",
      "Publicás las dos versiones.",
      "Cambiás la información oficial.",
      "Verificás la información y usás la fuente autorizada."
    ],
    "respuesta_correcta": 3,
    "feedback_correcto": "Bien. La IA es una herramienta de apoyo. Las fuentes oficiales y el criterio profesional tienen prioridad.",
    "feedback_incorrecto": "Las fuentes oficiales siempre tienen prioridad sobre lo que genera la IA.",
    "competencia": "Criterio profesional"
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 10;

  -- Módulo 11: Desafío Final
  UPDATE "CapacitateModulo" SET contenido = '{
    "escenario": "Tu jefe te pide preparar para mañana un resumen comparativo de tres propuestas recibidas de distintos proveedores, para una presentación ante el equipo de dirección. Tenés los tres documentos, pero uno incluye información confidencial de costos internos.",
    "tareas": [
      {
        "titulo": "¿Qué definís primero?",
        "descripcion": "Antes de empezar, ¿qué definís?",
        "opciones": [
          "Qué información contienen las propuestas, qué debe incluir el resumen y para quién es.",
          "Qué colores usar en la presentación.",
          "Cuántas páginas tiene cada propuesta.",
          "Si la IA puede hacer toda la tarea sola."
        ],
        "respuesta_correcta": 0,
        "competencia": "Criterio profesional",
        "feedback": "Definir objetivo, contenido y audiencia antes de usar IA es el primer paso.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés con la información confidencial?",
        "descripcion": "Una de las propuestas contiene información confidencial de costos internos.",
        "opciones": [
          "Cargás los tres PDFs directamente en cualquier herramienta de IA.",
          "Cargás todos y después borrás lo que no querés.",
          "Verificás qué información puede compartirse según las políticas de la empresa antes de introducirla en la IA.",
          "Usás solo la propuesta sin información confidencial y listo."
        ],
        "respuesta_correcta": 2,
        "competencia": "Protección de información",
        "feedback": "Antes de introducir información en una IA, verificar si es confidencial y qué dice la política.",
        "peso": 10
      },
      {
        "titulo": "¿Cuál prompt es más preciso?",
        "descripcion": "Necesitás que la IA resuma las tres propuestas para comparar sus puntos clave.",
        "opciones": [
          "\"Resumí esto.\"",
          "\"Hacé un resumen.\"",
          "\"Analizá.\"",
          "\"Resumí estas tres propuestas en una tabla comparativa con: nombre de la propuesta, objetivo, costos estimados y puntos fuertes. Máximo tres líneas por propuesta.\""
        ],
        "respuesta_correcta": 3,
        "competencia": "Creación de prompts",
        "feedback": "Formato específico + límites claros = resultado mucho más útil.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés si el resultado es muy técnico?",
        "descripcion": "La IA devolvió un resumen muy técnico para una audiencia no especializada.",
        "opciones": [
          "Lo usás igual porque la IA lo generó.",
          "Lo descartás completamente.",
          "Le pedís que lo reformule con lenguaje más simple para una audiencia no técnica.",
          "Cambiás algunas palabras vos mismo sin pedir más."
        ],
        "respuesta_correcta": 2,
        "competencia": "Iteración de resultados",
        "feedback": "Iterar con una instrucción clara es más eficiente que corregir manualmente.",
        "peso": 10
      },
      {
        "titulo": "¿Qué le pedís cuando mezcla información?",
        "descripcion": "El resumen mezcla información de las tres propuestas sin diferenciarlas.",
        "opciones": [
          "Que sea más breve.",
          "Que identifique y separe claramente la información de cada propuesta.",
          "Que use emojis para separar.",
          "Que lo convierta en imágenes."
        ],
        "respuesta_correcta": 1,
        "competencia": "Iteración de resultados",
        "feedback": "Instrucción específica sobre el problema que detectaste = iteración efectiva.",
        "peso": 10
      },
      {
        "titulo": "¿Cuál instrucción de seguimiento es mejor?",
        "descripcion": "Querés que cada propuesta tenga su propia sección con ventajas y desventajas.",
        "opciones": [
          "\"Mejor.\"",
          "\"Hacelo distinto.\"",
          "\"Presentá cada propuesta en una sección separada con título, ventajas y desventajas en bullets.\"",
          "\"Modificá todo.\""
        ],
        "respuesta_correcta": 2,
        "competencia": "Redacción de instrucciones",
        "feedback": "Una instrucción específica y estructurada produce el resultado que necesitás.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés si hay un dato incorrecto?",
        "descripcion": "La IA menciona que una propuesta ofrece 6 meses de garantía, pero el documento original dice 3.",
        "opciones": [
          "Usás el dato de la IA.",
          "Promediás: 4,5 meses.",
          "Eliminás la sección de garantía.",
          "Verificás con el documento original y corregís el dato."
        ],
        "respuesta_correcta": 3,
        "competencia": "Verificación de información",
        "feedback": "La IA puede equivocarse. El documento original es la fuente de verdad.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés si el resumen no cabe en una diapositiva?",
        "descripcion": "La presentación final debe caber en una sola diapositiva. El resumen tiene 4 páginas.",
        "opciones": [
          "Le pedís a la IA que lo condense en un formato breve para una sola diapositiva con los puntos más importantes.",
          "Enviás las 4 páginas igual.",
          "Lo eliminás y hacés la diapositiva sin IA.",
          "Le preguntás a alguien más."
        ],
        "respuesta_correcta": 0,
        "competencia": "Iteración de resultados",
        "feedback": "Iterar con el formato correcto es parte del proceso. La IA puede adaptarlo.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés si el resultado expone datos confidenciales?",
        "descripcion": "El resultado final incluye el nombre y el precio de un proveedor. Esa información era confidencial.",
        "opciones": [
          "Lo enviás igual porque ya estaba en el documento original.",
          "Avisás que el documento tiene información confidencial y eliminás esos datos antes de compartirlo.",
          "Solo lo compartís internamente.",
          "Le pedís permiso al proveedor."
        ],
        "respuesta_correcta": 1,
        "competencia": "Protección de información",
        "feedback": "Proteger información confidencial es una responsabilidad laboral. Hay que detectarla y eliminarla antes de compartir.",
        "peso": 10
      },
      {
        "titulo": "¿Qué hacés antes de entregar el resumen final?",
        "descripcion": "El resumen final está listo.",
        "opciones": [
          "Lo enviás inmediatamente.",
          "Revisás que la información sea correcta, el formato sea el pedido y no incluya datos confidenciales.",
          "Le pedís a la IA que lo revise.",
          "Lo enviás sin leer porque ya lo viste antes."
        ],
        "respuesta_correcta": 1,
        "competencia": "Criterio profesional",
        "feedback": "Revisión final: info correcta + formato adecuado + sin datos confidenciales. Siempre.",
        "peso": 10
      }
    ]
  }'::jsonb
  WHERE contenido_id = cap_id AND orden = 11;

END $$;
