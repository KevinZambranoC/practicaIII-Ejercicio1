export function setupRouteDetection() {
  document.addEventListener("DOMContentLoaded", () => {
    //  Aquí empieza mi zona de helpers, no te me pierdas 

    // Esta función recibe el texto que mete el usuario y trata de convertirlo en una matriz, revisando todo pa' que no se cuele nada raro
    function parseMatrix(text) {
      // Separo el texto en lineas (si trae espacios o saltos feos los quito)
      const lines = text.trim().split(/\r?\n/).filter(Boolean);

      // Si el archivo viene vacio o todo en blanco, de una aviso porque aquí no hay nada que hacer
      if (!lines.length) throw new Error("Archivo vacío, nada que ver aqui 😅");

      // Primera linea: saco F y C, que son filas y columnas, obvio
      const [F, C] = lines[0].split(/\s+/).map(Number);

      // De la segunda pa'lante voy sacando cada fila
      const matrix = lines.slice(1, 1 + F).map((ln, i) => {
        const row = ln.split(/\s+/).map(Number);
        // Si alguna fila viene con columnas demás o de menos, lo canto sin miedo
        if (row.length !== C) throw new Error(`Fila ${i+1} debe tener ${C} columnas, pero tiene ${row.length}. Arreglalo porfa 🙏`);
        return row;
      });

      // No me fio, reviso que la cantidad de filas sí cuadre con F
      if (matrix.length !== F) throw new Error(`Esperaba ${F} filas pero solo tengo ${matrix.length}. Revisa el archivo pls 🧐`);

      return { F, C, matrix };
    }

    // Detecto las minas con un algoritmo sencillito 
    function detectMines({ F, C, matrix }) {
      // Esto lo uso para guardar el resultado y pintarlo luego bonito
      const out = Array.from({ length: F }, () => Array(C).fill(" "));

      // Estas son todas las direcciones donde buscar alrededor 
      const dirs = [
        [-1,-1],[-1,0],[-1,1],
        [ 0,-1],        [ 0,1],
        [ 1,-1],[ 1,0],[ 1,1],
      ];

      // Recorro toda la matriz 
      for (let i = 0; i < F; i++) {
        for (let j = 0; j < C; j++) {
          let sum = 0, cnt = 0;
          // Me paseo por todos los vecinos 
          dirs.forEach(([di, dj]) => {
            const ni = i + di, nj = j + dj;
            if (ni >= 0 && ni < F && nj >= 0 && nj < C) {
              sum += matrix[ni][nj];
              cnt++;
            }
          });
          // Si el promedio + la celda es mayor que 40, aquí hay mina. Si no, dejo el cuadrito vacio.
          if (matrix[i][j] + (cnt ? sum/cnt : 0) > 40) out[i][j] = "💣";
        }
      }
      return out;
    }

    // Esto es pura facha: convierto un numero a emojis bonitos pa' la interfaz, pa' que se vea chevere
    function numEmoji(n) {
      return String(n).split("").map(d => d + "️⃣").join("");
    }

    //  Aquí referencio todos los elementos del DOM  
    const ia = document.getElementById("inputArea");
    const fi = document.getElementById("inputArchivo");
    const lb = document.getElementById("abrirArchivo");
    const cb = document.getElementById("btnLimpiar");
    const rb = document.getElementById("botonMagico");
    const rw = document.getElementById("resultWrapper");
    const grid = document.getElementById("gridArea");
    const db = document.getElementById("descargarBtn");
    const zb = document.getElementById("volverBtn");
    // Si cambias un ID de estos arriba, acuerdate de venir aqui, o si no, después vas a llorar

    // Eventos de la interfaz 

    // Cuando le das a "abrir archivo", simulo el click real del input escondido 
    lb.addEventListener("click", () => fi.click());

    // Cuando suben un archivo, lo leo y lo meto en el textarea
    fi.addEventListener("change", e => {
      const f = e.target.files[0];
      if (!f) return; // Si el usuario se arrepiente, no hago nada
      const fr = new FileReader();
      fr.onload = () => ia.value = fr.result;
      fr.readAsText(f);
      fi.value = ""; // Reinicio el input para que pueda volver a subir el mismo si quiere
    });

    // El botón de limpiar borra todo y esconde los resultados 
    cb.addEventListener("click", () => {
      ia.value = "";
      rw.classList.add("hidden");
      db.classList.add("hidden");
    });

    // Botón mágico: procesa la matriz, detecta las minas y pinta todo bonito
    rb.addEventListener("click", () => {
      try {
        // Parseo la matriz (aquí saltan errores si algo está mal)
        const { F, C, matrix } = parseMatrix(ia.value);

        // Aquí es donde hago la “magia” de las minas
        const mines = detectMines({ F, C, matrix });

        // Ajusto el grid visual, pa' que salga bonito en la página
        grid.style.gridTemplateColumns = `repeat(${C+1}, auto)`;
        const items = [];

        // Fila de arriba con los numeros bonitos
        items.push(`<div></div>`);
        for (let j = 1; j <= C; j++) {
          items.push(`<div class="bg-[#4098d7] rounded-md p-2">${numEmoji(j)}</div>`);
        }

        // Cuerpo del grid (cada fila con su numerito y el contenido)
        mines.forEach((row, i) => {
          items.push(`<div class="bg-[#4098d7] rounded-md p-2">${numEmoji(i+1)}</div>`);
          row.forEach(cell => {
            const disp = cell === " " ? "◻" : cell;
            items.push(`<div class="bg-[#1f2a3a] rounded-md p-2">${disp}</div>`);
          });
        });

        // Fila de abajo repitiendo los numeros (por si te pierdes)
        items.push(`<div></div>`);
        for (let j = 1; j <= C; j++) {
          items.push(`<div class="bg-[#4098d7] rounded-md p-2">${numEmoji(j)}</div>`);
        }

        // Pinto todo en el DOM (por fin)
        grid.innerHTML = items.join("");
        rw.classList.remove("hidden");

        // Preparo el texto para descargar 
        const header = Array.from({ length: C }, (_, j) => numEmoji(j+1)).join(" ");
        let textOut = "   " + header + "\n";
        for (let i = 0; i < F; i++) {
          const rowEmj = numEmoji(i+1);
          const rowCells = mines[i].map(cell => cell === " " ? "◻" : cell).join("  ");
          textOut += rowEmj + " " + rowCells + "\n";
        }
        textOut += "   " + header;

        // Armo el archivo y le asigno el link al botón de descarga
        const blob = new Blob([textOut], { type: "text/plain" });
        db.href = URL.createObjectURL(blob);
        db.classList.remove("hidden");

        // Hago scroll para que el usuario vea el resultado 
        rw.scrollIntoView({ behavior: "smooth" });

      } catch (err) {
        // Si algo sale mal, aviso con el mensaje que puse arriba 
        alert(err.message);
      }
    });

    // Si le das a "volver", te regreso al inicio. Sencillo.
    zb.addEventListener("click", () => window.location.href = "/");
  });
}
