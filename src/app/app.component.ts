import {Component} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {
  CellEditingStoppedEvent,
  ColDef,
  GetServerSideStoreParamsParams,
  GridApi,
  GridReadyEvent,
  IServerSideGetRowsParams,
  Module,
  RowNode,
  ServerSideTransactionResult,
  SetFilterValuesFuncParams,
  ValueParserParams,
  ColumnApi
} from "@ag-grid-community/core";
import {ServerSideRowModelModule} from "@ag-grid-enterprise/server-side-row-model";
import {MenuModule} from "@ag-grid-enterprise/menu";
import {ColumnsToolPanelModule} from "@ag-grid-enterprise/column-tool-panel";
import {SetFilterModule} from "@ag-grid-enterprise/set-filter";
import {DialogElementsExampleDialog} from "./create.popup";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-root',
  styles: [`#myGrid {
    width: 1600px;
    height: 1200px;
  }`],
  template: `
    <div>
      <button mat-button (click)="openDialog()">Create</button>
      <button mat-button (click)="onDelete()">Delete</button>
    </div>
    <ag-grid-angular
      #agGrid
      id="myGrid"
      class="ag-theme-alpine"
      [modules]="modules"
      [rowModelType]="rowModelType"
      [serverSideStoreType]="serverSideStoreType"
      [getServerSideStoreParams]="getServerSideStoreParams"
      [rowGroupPanelShow]="rowGroupPanelShow"
      [rowSelection]="rowSelection"
      [columnDefs]="columnDefs"
      [defaultColDef]="defaultColDef"
      [autoGroupColumnDef]="autoGroupColumnDef"
      [columnTypes]="columnTypes"
      [rowData]="rowData"
      (gridReady)="onGridReady($event)"
      (cellEditingStopped)="onCellEditingStopped($event)"
    >
    </ag-grid-angular>
  `,
})

export class AppComponent {
  public readonly rowModelType = 'serverSide';
  public readonly serverSideStoreType = 'partial';
  public readonly rowGroupPanelShow = 'always';
  public readonly modules: Module[] = [ServerSideRowModelModule, ColumnsToolPanelModule, MenuModule, SetFilterModule]
  public readonly columnDefs: ColDef[];
  public readonly defaultColDef: ColDef;
  public readonly autoGroupColumnDef: ColDef = {flex: 2, filter: false, sortable: false}
  public readonly columnTypes: {};
  public readonly rowSelection = 'single'
  public getServerSideStoreParams: (params: GetServerSideStoreParamsParams) => void = params => {
    const groupingActive = !(params.rowGroupColumns.length === 0);
    if (groupingActive) {
      return {
        storeType: 'full',
        cacheBlockSize: 100,
        maxBlocksInCache: 5,
      };
    } else {
      return {
        storeType: 'partial',
        cacheBlockSize: 20,
        maxBlocksInCache: -1,
      };
    }
  }
  public rowData: {}[];

  private gridApi?: GridApi;
  private columnApi?: ColumnApi;


  constructor(private http: HttpClient, private dialog: MatDialog) {
    this.rowData = [];
    this.defaultColDef = {flex: 1, sortable: true, enableRowGroup: true};
    this.columnTypes = {
      numberColumn: {
        editable: true,
        filter: "agNumberColumnFilter",
        valueParser: this.numberValueParser,
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          suppressAndOrCondition: true,
          filterOptions: ['equals', 'lessThan', 'greaterThan']
        }
      },
      setFilterColumn: {
        filter: 'agSetColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          refreshValuesOnOpen: true,
          values: this.getSetFilterValues.bind(this)
        }
      },
      textFilterColumn: {
        filter: 'agTextColumnFilter',
        filterParams: {
          buttons: ['apply', 'reset'],
          closeOnApply: true,
          suppressAndOrCondition: true,
          filterOptions: ['contains']
        },
      }
    };

    this.columnDefs = [
      {
        field: 'athlete',
        type: 'textFilterColumn',
        flex: 2
      },
      {
        field: 'age',
        type: 'numberColumn'
      },
      {
        field: 'country',
        flex: 1.5,
        type: 'setFilterColumn',
      },
      {
        field: 'sport',
        flex: 2,
        type: 'setFilterColumn'
      },
      {
        field: 'gold',
        type: 'numberColumn'
      },
      {
        field: 'silver',
        type: 'numberColumn'
      },
      {
        field: 'bronze',
        type: 'numberColumn'
      },
    ];
  }

  private getSetFilterValues(params: SetFilterValuesFuncParams): void {
    const body = {field: params.colDef.field, filterModel: this.gridApi?.getFilterModel()}
    this.http.post('http://localhost:3000/setFilterValues', body).subscribe(data => params.success(data as string[]))
  }

  private isGroupingActive: () => boolean = () => !(this.columnApi?.getRowGroupColumns().length === 0);

  private noGroupingRefresh: () => void = () => this.gridApi?.refreshServerSideStore({purge: false});

  private createServerSideData(newRowData: {}): void {
    this.http.post('http://localhost:3000/create', newRowData)
      .subscribe((resMsg) => {
          console.log(resMsg)
        }
      )
    if (this.isGroupingActive()) {
      const result: ServerSideTransactionResult = this.gridApi?.applyServerSideTransaction({
          add: [newRowData],
        },
      ) as ServerSideTransactionResult
      console.log(result)
    } else {
      this.noGroupingRefresh();
    }
  }

  private updateServerSideData(id: number, updateData: {}): void {
    const body = {id, updateData}
    this.http.post('http://localhost:3000/update', body)
      .subscribe((resMsg) => {
        console.log(resMsg)
      })
  }

  private getRoute(node: RowNode): string[] {
    let route: string[] = [];
    if (node.level >= 0) {
      if (node.group) { // is a grouping node
        const field: string = node.key as string
        route = [field, ...route]
      }
      route = [...this.getRoute(node.parent as RowNode), ...route]
    }
    return route;
  }

  private deleteServerSideData(id: number): void {
    const body = {id};
    this.http.post('http://localhost:3000/delete', body)
      .subscribe((resMsg) => {
        console.log(resMsg)
      })
  }


  public openDialog(): void {
    let dialogRef = this.dialog.open(DialogElementsExampleDialog);
    dialogRef.afterClosed().subscribe(newRowData => {
      this.createServerSideData(newRowData)
    })
  }

  public numberValueParser(params: ValueParserParams): number {
    return Number(params.newValue);
  }

  public onDelete(): void {
    if (this.gridApi) {
      const gridApi = this.gridApi;
      const node: RowNode = gridApi.getSelectedNodes()[0]
      const nodeId = node.data.id;
      this.deleteServerSideData(nodeId);

      if (this.isGroupingActive()) {
        const result: ServerSideTransactionResult = gridApi.applyServerSideTransaction({
            remove: [node.data],
            route: this.getRoute(node)
          },
        ) as ServerSideTransactionResult
        console.log(result)
      } else {
        this.noGroupingRefresh();
      }
    }
  }

  public onCellEditingStopped(params: CellEditingStoppedEvent): void {
    this.updateServerSideData(params.data.id, params.data);
    params.node.setData(params.data);
  }

  public onGridReady(params: GridReadyEvent): void {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;
    const that = this;

    this.gridApi.setServerSideDatasource({
      getRows(params: IServerSideGetRowsParams) {
        const {startRow, endRow, rowGroupCols, groupKeys, filterModel, sortModel} = params.request;
        const body = {startRow, endRow, rowGroupCols, groupKeys, filterModel, sortModel};
        that.http.post('http://localhost:3000/read', body)
          .subscribe((dataAndCount) => {
            const receivedData = dataAndCount as { rows: {}[], count: number }
            params.success({
              rowData: receivedData.rows,
              rowCount: receivedData.count
            });
          })
        return;
      }
    })
  }
}
