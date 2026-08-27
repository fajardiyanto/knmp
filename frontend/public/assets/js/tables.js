function generateDataTable(params) {
    return new DataTable(params.id, {
        order: params.order,
        ordering: params.ordering,
        responsive: params.responsive,
        columnDefs: params.columnDefs,
        language: defaultLanguage,
    });
}
