using CatalogService as service from '../../srv/cat-service';
annotate service.Products with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'name',
                Value : details.name,
            },
            {
                $Type : 'UI.DataField',
                Label : 'description',
                Value : details.description,
            },
            {
                $Type : 'UI.DataField',
                Label : 'unit_type',
                Value : details.unit_type,
            },
            {
                $Type : 'UI.DataField',
                Label : 'unit_price',
                Value : details.unit_price,
            },
            {
                $Type : 'UI.DataField',
                Label : 'warranty',
                Value : warranty,
            },
            {
                $Type : 'UI.DataField',
                Label : 'stock',
                Value : stock,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],

    UI.SelectionFields: [
        code,
        status,
        details.unit_type  
    ],

    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'name',
            Value : details.name,
        },
        {
            $Type : 'UI.DataField',
            Label : 'description',
            Value : details.description,
        },
        {
            $Type : 'UI.DataField',
            Label : 'unit_type',
            Value : details.unit_type,
        },
        {
            $Type : 'UI.DataField',
            Label : 'unit_price',
            Value : details.unit_price,
        }
    ],
);

annotate service.Details with {
    unit_type @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Details',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : unit_type,
                    ValueListProperty : 'unit_type',
                },
            ],
            Label : 'Unit_type',
        },
        Common.ValueListWithFixedValues : true,
)};

