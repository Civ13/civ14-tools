# recipe-maker

Reads civ14's ymls and generates crafting recipes for them.
Place the input files in `input/`. Make sure they have the details (construction time, cost, material) in the `Construction` component, example below:

```
-   type: Construction
     graph: StrawWall
     node: end
     cost: 5
     material: Straw
     time: 10
```
