const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

app.post("/generar-pdf", async (req, res) => {
  const { nombre, edad, correo, fecha } = req.body;

  const plantillaPath = path.join(__dirname, "plantilla.tex");
  const outputFile = path.join(__dirname, "temp.pdf"); // Cambiar a temp.pdf
  const tempTexFile = path.join(__dirname, "temp.tex");

  try {
    // Leer la plantilla LaTeX
    let plantilla = fs.readFileSync(plantillaPath, "utf8");

    // Reemplazar las variables
    plantilla = plantilla
      .replace(/<<nombre>>/g, nombre)
      .replace(/<<edad>>/g, edad)
      .replace(/<<correo>>/g, correo)
      .replace(/<<fecha>>/g, fecha); // Reemplazar <<fecha>>

    // Guardar el archivo temporal
    fs.writeFileSync(tempTexFile, plantilla, "utf8");

    // Compilar el archivo LaTeX con pdflatex
    exec(
      `pdflatex -output-directory=${__dirname} temp.tex`,
      (err, stdout, stderr) => {
        if (err) {
          console.error("Error al compilar LaTeX:", err, stderr);
          return res.status(500).send("Error al generar el PDF");
        }

        console.log("PDF generado correctamente:");
        // console.log("PDF generado correctamente:", stdout);

        // Enviar el PDF generado al cliente
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=documento.pdf"
        );
        res.sendFile(outputFile, () => {
          // Limpiar archivos temporales después de enviar el PDF
          fs.unlinkSync(tempTexFile);
          fs.unlinkSync(outputFile);
          fs.unlinkSync(path.join(__dirname, "temp.aux"));
          fs.unlinkSync(path.join(__dirname, "temp.log"));
        });
      }
    );
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error al procesar la solicitud");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
