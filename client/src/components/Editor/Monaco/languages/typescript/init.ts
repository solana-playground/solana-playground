export const init = async () => {
  const { initDeclarations } = await import("./declarations");
  return await initDeclarations();
};
