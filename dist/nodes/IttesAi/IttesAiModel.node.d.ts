import type { ISupplyDataFunctions, INodeType, INodeTypeDescription, SupplyData } from 'n8n-workflow';
export declare class IttesAiModel implements INodeType {
    description: INodeTypeDescription;
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
