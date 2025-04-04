import { getAncestorsTree } from "topola";
import {
  Chart,
  ChartInfo,
  ChartOptions,
  ExpanderDirection,
  Fam,
  Indi,
} from "topola";
import { ChartUtil, getChartInfo } from "topola";
import { layOutDescendants } from "topola";

/**
 * Renders an hourglass chart. It consists of an ancestor chart and
 * a descendant chart for a family.
 */
export class FanChart<IndiT extends Indi, FamT extends Fam> implements Chart {
  readonly util: ChartUtil;

  constructor(readonly options: ChartOptions) {
    this.util = new ChartUtil(options);
  }

  render(): ChartInfo {
    const ancestorsRoot = getAncestorsTree(this.options);
    const ancestorNodes = this.util.layOutChart(ancestorsRoot, {
      flipVertically: true,
    });

    const descendantNodes = layOutDescendants(this.options);

    // The first ancestor node and descendant node is the start node.
    if (ancestorNodes[0].data.indi?.expander !== undefined) {
      descendantNodes[0].data.indi!.expander =
        ancestorNodes[0].data.indi?.expander;
    }
    if (ancestorNodes[0].data.spouse?.expander !== undefined) {
      descendantNodes[0].data.spouse!.expander =
        ancestorNodes[0].data.spouse?.expander;
    }

    // slice(1) removes the duplicated start node.
    const nodes = ancestorNodes.slice(1).concat(descendantNodes);
    const animationPromise = this.util.renderChart(nodes);

    const info = getChartInfo(nodes);
    this.util.updateSvgDimensions(info);
    return Object.assign(info, { animationPromise });
  }
}
