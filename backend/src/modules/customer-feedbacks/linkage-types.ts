export type FeedbackLinkageItem = {
  productId: string;
  productCode: string;
  productName: string;
  materialId?: string | null;
  materialCode?: string | null;
  materialName?: string | null;
};

export type FeedbackLinkageInput = {
  productId: string;
  materialId?: string | null;
};

export type LinkageOptionContract = {
  id: string;
  code: string;
  title: string;
};

export type LinkageOptionProduct = {
  id: string;
  code: string;
  name: string;
  contractIds: string[];
};

export type LinkageOptionMaterial = {
  id: string;
  code: string;
  name: string;
  /** SP có VT này trong BOM (gộp, một dòng / VT) */
  productIds: string[];
  contractIds: string[];
};

export type LinkageOptionsResponse = {
  contracts: LinkageOptionContract[];
  products: LinkageOptionProduct[];
  materials: LinkageOptionMaterial[];
};
