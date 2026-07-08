declare module "nigerian-universities" {
  export interface NigerianUniversity {
    name: string;
    city: string;
    state: string;
    logo: string;
  }

  const universities: NigerianUniversity[];
  export default universities;
}
