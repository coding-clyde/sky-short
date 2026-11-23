import React from "react";
import { Composition, registerRoot } from "remotion";
import { SkyShort, SKY_FRAMES } from "./videos/sky/Sky";

const Root: React.FC = () => (
  <Composition id="SkyShort" component={SkyShort} durationInFrames={SKY_FRAMES} fps={30} width={1080} height={1920} />
);

registerRoot(Root);
