declare module "sinon-chrome" {
  const chromeStub: typeof chrome & {
    flush(): void;
    reset(): void;
  };
  export default chromeStub;
}
