import { createFileRoute } from "@tanstack/react-router";
import { VoxelGame } from "../components/VoxelGame";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <VoxelGame />;
}
