import type { ISupplyDataFunctions, INodeType, INodeTypeDescription, SupplyData, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
export declare class IttesAiModel implements INodeType {
    description: INodeTypeDescription;
    methods: {
        loadOptions: {
            getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]>;
        };
    };
    supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData>;
}
