import { useMemo } from "react";
import { FamilyTreePage } from "./photobook/FamilyTreePage";
import { PhotosPage } from "./photobook/PhotosPage";
import { TitlePage } from "./photobook/TitlePage";
import { PBFamily, PBPerson, PBTreeData } from "../pages/photoBookModel";

interface PhotoBookPageProps {
  treeData: PBTreeData;
  title?: string;
}

const pageStyle = {
  backgroundImage: "url(/images/background.webp)",
  backgroundSize: "contain",
  backgroundRepeat: "no-repeat",
  backgroundPositionX: "center",
  backgroundPositionY: "center",
};

enum PageTypeEnum {
  PHOTO,
  TREE,
}

export const PhotoBook = ({ treeData, title }: PhotoBookPageProps) => {
  const families = treeData.familiesToDisplay;
  // In order to link other families we will need the pagenumbers of the families.
  const pages = useMemo(() => {
    const pageNumbers = {} as Record<string, number>;
    const pageConfig = [] as {
      family: PBFamily;
      pageNum: number;
      pageType: PageTypeEnum;
    }[];

    const pages = [] as JSX.Element[];

    let i = 0;
    let pageNum = 1;

    if (title && title.length > 0 && families.length > 0) {
      pages.push(
        <TitlePage
          key="title"
          text={title}
          pageNum={pageNum++}
          pageStyle={pageStyle}
        />,
      );
    }

    while (i < families.length) {
      const currentFamily = families[i];
      const currentFamilyNoImages = !(
        currentFamily.media_list && currentFamily.media_list?.length > 0
      );
      const nextFamily = i + 1 < families.length ? families[i + 1] : null;
      const nextFamilyNoImages =
        !nextFamily ||
        !(nextFamily.media_list && nextFamily.media_list?.length > 0);
      if (nextFamily && currentFamilyNoImages && nextFamilyNoImages) {
        // Put them on the same pages facing each other.
        pageNumbers[currentFamily.gramps_id] = pageNum;
        pageConfig.push({
          family: currentFamily,
          pageNum: pageNum++,
          pageType: PageTypeEnum.TREE,
        });
        pageNumbers[nextFamily.gramps_id] = pageNum;
        pageConfig.push({
          family: nextFamily,
          pageNum: pageNum++,
          pageType: PageTypeEnum.TREE,
        });
        i += 2;
      } else if (currentFamilyNoImages && nextFamily == null) {
        // Last family without images
        pageNumbers[currentFamily.gramps_id] = pageNum;
        pageConfig.push({
          family: currentFamily,
          pageNum: pageNum++,
          pageType: PageTypeEnum.TREE,
        });
        i += 1;
      } else {
        // Put them on separate pages
        pageConfig.push({
          family: currentFamily,
          pageNum: pageNum++,
          pageType: PageTypeEnum.PHOTO,
        });
        pageNumbers[currentFamily.gramps_id] = pageNum;
        pageConfig.push({
          family: currentFamily,
          pageNum: pageNum++,
          pageType: PageTypeEnum.TREE,
        });
        i += 1;
      }
    }

    pageConfig.forEach(({ family, pageNum, pageType }) => {
      switch (pageType) {
        case PageTypeEnum.PHOTO:
          pages.push(
            <PhotosPage
              key={`photos-${family.gramps_id}`}
              family={family}
              pageNum={pageNum}
              pageStyle={pageStyle}
            />,
          );
          break;
        case PageTypeEnum.TREE:
          pages.push(
            <FamilyTreePage
              key={`tree-${family.gramps_id}`}
              treeData={treeData}
              family={family}
              pageNum={pageNum}
              pageStyle={pageStyle}
              pages={pageNumbers}
            />,
          );
          break;
      }
    });

    return pages;
  }, [treeData]);

  return <>{pages}</>;
};
