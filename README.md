# Simulador 3D de Cinemática — Aulas 1 a 9

Simulador 3D interativo (Three.js + React Three Fiber) para as aulas de
Cinemática do 4º bimestre de Ciências (Ensino Fundamental Anos Finais),
pensado para ser usado **ao vivo em sala, com projetor**, e também permitir
que os alunos mexam nos parâmetros pelo próprio dispositivo.

## Como rodar no VS Code

1. Abra esta pasta (`fisica-sim`) no VS Code.
2. Abra um terminal (`` Ctrl+` ``) e rode:
   ```bash
   npm install
   npm run dev
   ```
3. Abra o link que aparecer no terminal (algo como `http://localhost:5173`).
4. Para projetar em tela cheia, use `F11` no navegador.

Para gerar uma versão de produção (mais rápida, para rodar sem o terminal
aberto):
```bash
npm run build
npm run preview
```

## Estrutura do projeto

```
src/
  data/lessons.js       → conteúdo das 9 aulas (objetivos, tópicos, fórmulas)
  store/useAppStore.js  → estado global (modo apresentação/interativo)
  components/
    Hub.jsx             → tela inicial com o menu das 9 aulas
    LessonPage.jsx       → roteador: escolhe a cena 3D certa pelo slug da URL
    ui.jsx               → Slider, Readout, Formulas (controles reutilizáveis)
  scenes/
    SceneShell.jsx       → "casca" 3D comum (luz, piso, sombras, pós-processamento)
    primitives.jsx        → Vehicle, Ball, Arrow3D, RulerTrack, Label3D (peças reutilizáveis)
    Lesson1History.jsx … Lesson9LabAcceleration.jsx → uma cena por aula
```

Cada aula é uma cena independente em `src/scenes/`. Para editar o
comportamento de uma aula específica, mexa só no arquivo dela — elas não
dependem umas das outras, só das peças reutilizáveis em `primitives.jsx`.

## O que já está pronto (Aulas 1-9)

| Aula | Tema | Interação |
|---|---|---|
| 1 | História do movimento (Aristóteles x Galileu) | soltar esferas de massas diferentes da Torre de Pisa |
| 2 | Referencial / 1ª Lei de Newton | alternar entre referencial do solo e do carro |
| 3 | Posição, distância e deslocamento | percurso A→C→B com contadores ao vivo |
| 4 | Velocidade média x instantânea | sliders de ΔS/Δt + velocímetro animado |
| 5 | Velocidade em percursos de 2 trechos | compara v média real x média aritmética (erro comum) |
| 6 | Aceleração, 2ª e 3ª Leis de Newton | sliders de força/massa, vetores 3D de força |
| 7 | Aceleração — exercícios de corrida | conversão km/h↔m/s, carro acelerando |
| 8 | Desafio: medir velocidade (carrinho de fricção) | cronômetro virtual, tabela de até 5 medições |
| 9 | Desafio: calcular aceleração | duas medições de velocidade → a = ΔV/Δt |

## Modo apresentação x modo interativo

O botão no canto superior direito do Hub alterna entre:
- **🖥️ Apresentação**: pensado para o professor conduzir na TV/projetor.
- **🙋 Interativo (alunos)**: mesma tela, mas pensada para cada aluno acessar
  pelo próprio dispositivo e mexer nos parâmetros junto com a aula.

Nesta versão, os dois modos rodam localmente (cada aluno teria sua própria
simulação, sem sincronizar com a do professor). Para sincronizar em tempo
real tudo que o professor faz com a tela dos alunos (todos veem o mesmo
carrinho se movendo ao mesmo tempo), o próximo passo seria publicar o app
em um servidor (ex.: Vercel, Netlify) e usar algo como Firebase, Supabase
ou um WebSocket simples para replicar o estado do `useAppStore` entre todos
os dispositivos conectados.

## Como estender para as Aulas 10 a 20 (Sistema Solar, estrelas, etc.)

1. Acrescente os dados da nova aula em `src/data/lessons.js`.
2. Crie um novo arquivo em `src/scenes/LessonXNomeDaCena.jsx`, copiando a
   estrutura de alguma cena parecida como ponto de partida (ex.:
   `Lesson1History.jsx` para algo relacionado a astronomia/gravitação).
3. Registre o novo componente em `SCENE_BY_TYPE` dentro de
   `src/components/LessonPage.jsx`.
4. Pronto — a aula já aparece automaticamente no Hub.

## Atualização visual (qualidade gráfica)

Todas as cenas 3D agora usam:
- Céu procedural e iluminação de ambiente (sem depender de internet — tudo gerado por código, funciona offline).
- Piso com textura de "asfalto" gerada por código (grão + manchas de pneu).
- Sombras de contato suaves sob os objetos.
- Pós-processamento: SSAO (oclusão de ambiente), bloom e anti-serrilhado (SMAA).
- Materiais com verniz automotivo (clearcoat) nos carrinhos e nas esferas, para um acabamento mais realista.

Isso deixa o visual bem mais próximo de um jogo 3D, mantendo tudo rodando localmente, sem internet.

## Fontes

O conteúdo (objetivos, tópicos e fórmulas) foi extraído do material de
aula fornecido (SEDUC-SP, 4º bimestre de Ciências, Aulas 1 a 9).
