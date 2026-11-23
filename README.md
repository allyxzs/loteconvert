# LoteConvert 2.0

Abra index.html em um navegador moderno. Selecione ou arraste imagens, escolha PNG, JPEG ou WebP e clique em Converter lote. Baixe cada resultado ou reúna os arquivos concluídos em um ZIP. Nomes repetidos recebem um sufixo numérico.

O processamento ocorre no dispositivo com JavaScript e Canvas. O JSZip 3.10.1 acompanha o projeto em vendor, junto de sua licença. A aplicação funciona offline e dispensa instalação ou compilação.

Cada lote aceita até 40 arquivos, com limite de 15 MB e 20 megapixels por imagem. O consumo de memória depende do navegador e das dimensões das imagens. Por padrão, a conversão mantém as dimensões e gera imagens estáticas. JPEG aplica fundo branco às áreas transparentes. A qualidade pode ser ajustada para JPEG e WebP. O suporte à codificação WebP depende do navegador.

## Redimensionamento e nomes em lote

Informe o limite em pixels do lado maior para reduzir imagens preservando a proporção. Por exemplo, 4000 × 3000 com limite de 1600 resulta em 1600 × 1200. Um prefixo opcional numera os resultados a partir de 001, na ordem da fila, tanto no ZIP como nos downloads individuais.
