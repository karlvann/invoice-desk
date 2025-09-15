export interface MattressLayer {
  model: string;
  firmness: number;
  layer5: string;
  layer4: string;
  layer3: string;
  layer2: string;
  springsPosition: string;
  mainSpringLayer: string;
  underSprings1: string;
  underSprings2: string;
  underSprings3: string;
}

export const mattressLayers: MattressLayer[] = [
  // Cloud models
  { model: "cloud", firmness: 2, layer5: "-", layer4: "soft latex", layer3: "micro", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "felt", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 3, layer5: "soft latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 4, layer5: "soft latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 5, layer5: "-", layer4: "soft latex", layer3: "micro", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "felt", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 6, layer5: "soft latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 7, layer5: "soft latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 8, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "felt", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 9, layer5: "medium latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 10, layer5: "medium latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 11, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "felt", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 12, layer5: "medium latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  { model: "cloud", firmness: 13, layer5: "medium latex", layer4: "micro", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "-", underSprings2: "-", underSprings3: "-" },
  
  // Aurora models
  { model: "aurora", firmness: 2, layer5: "-", layer4: "-", layer3: "soft latex", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "aurora", firmness: 3, layer5: "-", layer4: "soft latex", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 4, layer5: "soft latex", layer4: "micro", layer3: "blue", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "soft spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 5, layer5: "-", layer4: "-", layer3: "soft latex", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "blue", underSprings3: "felt" },
  { model: "aurora", firmness: 6, layer5: "-", layer4: "soft latex", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "blue", underSprings3: "-" },
  { model: "aurora", firmness: 7, layer5: "soft latex", layer4: "micro", layer3: "blue", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 8, layer5: "-", layer4: "-", layer3: "medium latex", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "aurora", firmness: 9, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 10, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 11, layer5: "-", layer4: "-", layer3: "medium latex", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "aurora", firmness: 12, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 13, layer5: "-", layer4: "medium latex", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 14, layer5: "-", layer4: "-", layer3: "firm latex", layer2: "micro", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "aurora", firmness: 15, layer5: "-", layer4: "firm latex", layer3: "micro", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "aurora", firmness: 16, layer5: "-", layer4: "firm latex", layer3: "micro", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "firm spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  
  // Cooper models
  { model: "cooper", firmness: 5, layer5: "-", layer4: "white", layer3: "white", layer2: "white", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "cooper", firmness: 6, layer5: "white", layer4: "white", layer3: "white", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "cooper", firmness: 7, layer5: "white", layer4: "white", layer3: "purple", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "cooper", firmness: 8, layer5: "-", layer4: "white", layer3: "white", layer2: "purple", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "felt", underSprings3: "-" },
  { model: "cooper", firmness: 9, layer5: "white", layer4: "white", layer3: "purple", layer2: "felt", springsPosition: "soft side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
  { model: "cooper", firmness: 10, layer5: "white", layer4: "white", layer3: "purple", layer2: "felt", springsPosition: "firm side up", mainSpringLayer: "medium spring - 13cm", underSprings1: "purple", underSprings2: "-", underSprings3: "-" },
];