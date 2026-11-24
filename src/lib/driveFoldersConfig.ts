export interface DefaultDriveFolderConfig {
  name: string;
  folderId: string;
  url: string;
  defaultCategory: string;
}

export const DEFAULT_DRIVE_FOLDERS: DefaultDriveFolderConfig[] = [
  {
    name: 'Newborns',
    folderId: '1D-rTXVnmdOw4OcEFJMaBmM0OmrNFaHCj',
    url: 'https://drive.google.com/drive/folders/1D-rTXVnmdOw4OcEFJMaBmM0OmrNFaHCj',
    defaultCategory: 'newborn',
  },
  {
    name: 'Brand collabs',
    folderId: '1ol39emyIke0Q9dxc3IFEtW1IBYe4wtc6',
    url: 'https://drive.google.com/drive/folders/1ol39emyIke0Q9dxc3IFEtW1IBYe4wtc6',
    defaultCategory: 'brand-collaboration',
  },
  {
    name: 'Portraits, Maternity & Birth photography',
    folderId: '1Mmg6uyQZqnIGqaQunqZw3hFMm2srGtCv',
    url: 'https://drive.google.com/drive/folders/1Mmg6uyQZqnIGqaQunqZw3hFMm2srGtCv',
    defaultCategory: 'portrait',
  },
  {
    name: 'Private / Client Archive',
    folderId: '1ylo5VR3_AIfd8hQSavGANVmBv00bIk5l',
    url: 'https://drive.google.com/drive/folders/1ylo5VR3_AIfd8hQSavGANVmBv00bIk5l',
    defaultCategory: 'portrait',
  },
];
