# chartjs-chart-treenode

Renderiza gráficos de árbol (tree node) personalizados en Chart.js a partir de enlaces (`from`, `to`, `value`) usando `canvas`, sin crear nuevos tipos de gráfico, compatible con `scatter`.

---

## 📦 Instalación

```bash
npm install chartjs-chart-treenode
```

O si usas CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-chart-treenode"></script>
```

---

## 🧠 ¿Qué es esto?

Este plugin de Chart.js permite visualizar nodos y relaciones jerárquicas (tipo árbol) usando datasets con enlaces `from → to`. Calcula automáticamente la profundidad, la posición vertical y dibuja conexiones suavizadas entre nodos, con soporte para colores personalizados, bordes y tooltips flotantes personalizados.

---

## 📊 Ejemplo de uso

```js
import Chart from 'chart.js/auto';
import { treeNodePlugin } from 'chartjs-chart-treenode';

Chart.register(treeNodePlugin);

const ctx = document.getElementById('treeChart').getContext('2d');

new Chart(ctx, {
  type: 'scatter',
  data: {
    datasets: [{
      label: "Cantidad",
      data: [
        { from: "Root1", to: "A", value: 300 },
        { from: "A", to: "B", value: 200 }
      ],
      nodeColors: {
        "A": "#1976d2",
        "B": "orange"
      },
      nodeBorder: "4px",
      nodeBorderColor: "black"
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false, min: 0, max: 1 },
      y: { display: false, min: 0, max: 1 }
    }
  },
  plugins: [treeNodePlugin]
});
```

---

## 🧩 Opciones adicionales en el dataset

- `nodeColors`: Objeto `{ label: color }` para cambiar el color de cada nodo.
- `nodeBorder`: Borde de cada nodo (ej. `"2px"`).
- `nodeBorderColor`: Color del borde.
- `column`: Objeto `{ label: columnIndex }` para forzar columna de un nodo.
- `priority`: Objeto `{ label: prioridad }` para definir el orden vertical dentro de una columna.

---

## 🧪 Requisitos

- Chart.js `^4.x`
- Navegador moderno con soporte para `<canvas>`

---

## 🧑‍💻 Contribuciones

¡Bienvenidas! Puedes abrir un [issue](https://github.com/TU_USUARIO/chartjs-chart-treenode/issues) o hacer un pull request.

---

## 📄 Licencia

MIT