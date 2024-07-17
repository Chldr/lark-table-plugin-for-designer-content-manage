import { ReactNode, useEffect, useState } from "react";
import "./App.css";
import {
  FieldType,
  IOpenAutoNumber,
  ITable,
  bitable,
} from "@lark-base-open/js-sdk";
import classNames from "classnames";
import { TableType, TableDataType } from "./types";
import { tableConfig, SERVICE_ORIGIN } from "./constants";
import { tableNames } from "./types";

export default function App() {
  const [curTable, setCurTable] = useState<TableDataType>({
    id: "",
    name: "",
    table: null,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  // upload
  const [errorMsg, setErrorMsg] = useState<ReactNode>(null);
  // check
  const [checkTemplatePreview, setCheckTemplatePreview] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState("");
  // code field
  const [codeFieldName, setCodeFieldName] = useState("code");
  const [codeFieldList, setCodeFieldList] = useState<
    { id: string; name: string }[]
  >([]);

  const getTableData = async (_tableId: string | null) => {
    let tableId = _tableId;
    if (!tableId) {
      const selection = await bitable.base.getSelection();
      tableId = selection?.tableId;
    }
    if (!tableId) return null;
    const table = await bitable.base.getTableById(tableId);
    const name = await table.getName();
    return {
      name,
      id: table.id,
      table,
    };
  };

  const getTemplateCodes = async (table: ITable) => {
    console.log("codeFieldName: ", codeFieldName);

    const codeField = await table.getFieldByName(codeFieldName);
    const allRecords = await codeField.getFieldValueList();
    const sortList = allRecords.filter(
      (item) => !!(item.value as IOpenAutoNumber).value
    );
    sortList.sort((a, b) => {
      return (
        parseInt((a.value as IOpenAutoNumber).value) -
        parseInt((b.value as IOpenAutoNumber).value)
      );
    });
    setTemplateList(sortList);

    return sortList;
  };

  const getPrimaryFieldName = async (tableData: TableDataType) => {
    if (tableData.table) {
      const allPrimaryFields = await tableData.table.getFieldListByType(
        FieldType.AutoNumber
      );
      const list = [];
      for (const item of allPrimaryFields) {
        const name = await item.getName();
        list.push({
          id: item.id,
          name: name,
        });
      }
      return list;
    }
    return [];
  };

  async function init() {
    const tableData = await getTableData(null);
    if (tableData) {
      setCurTable(tableData);
      const allPrimaryFields = await getPrimaryFieldName(tableData);
      setCodeFieldList(allPrimaryFields);
      const defaultCodeFieldName = allPrimaryFields[0]?.name;
      setCodeFieldName(defaultCodeFieldName ?? "");
    }
  }

  useEffect(() => {
    init();
    const off = bitable.base.onSelectionChange(async (event) => {
      const data = event.data;
      const tableData = await getTableData(data.tableId);
      if (tableData) {
        reset();
        init();
      }
    });

    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    if (curTable?.table) {
      getTemplateCodes(curTable.table);
    }
  }, [codeFieldName, curTable]);

  useEffect(() => {
    if (curTable.name === "模版" && curTable.table) {
      const addRecordOff = curTable.table.onRecordAdd((ev) => {
        console.log("addRecordOff ev: ", ev);
        if (curTable.table) {
          getTemplateCodes(curTable.table);
        }
      });
      const removeRecordOff = curTable.table.onRecordDelete((ev) => {
        console.log("removeRecordOff ev: ", ev);
        if (curTable.table) {
          getTemplateCodes(curTable.table);
        }
      });
      return () => {
        addRecordOff?.();
        removeRecordOff?.();
      };
    }
  }, [curTable]);

  const reset = () => {
    setCheckError("");
    setErrorMsg("");
    setSelectedCode("");
    setCheckTemplatePreview("");
  };

  const isCheckable = Boolean(
    curTable?.name && tableConfig[curTable.name as TableType]?.checkApi
  );
  async function handleCheck() {
    if (isChecking || !isCheckable) return;
    const api =
      curTable.name && tableConfig[curTable.name as TableType]?.checkApi;
    if (!api) {
      setCheckError("当前表格没有检查配置");
      return;
    }
    setIsChecking(true);
    setCheckError("");
    setCheckTemplatePreview("");
    const selection = await bitable.base.getSelection();

    fetch(api, {
      method: "POST",
      body: JSON.stringify({
        app_token: selection.baseId,
        table_id: selection.tableId,
        view_id: selection.viewId,
        code: selectedCode,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.code === 0 && res.data) {
          setCheckTemplatePreview(res.data);
        } else {
          setCheckError(res.msg);
        }
      })
      .catch(() => {
        setCheckError("模版检查出错");
      })
      .finally(() => {
        setIsChecking(false);
      });
  }

  const handleUploadTable = async () => {
    // Get the current selection
    const selection = await bitable.base.getSelection();
    console.log("selection: ", selection);
    // Find current table by tableId
    if (!selection?.tableId) return;
    const table = await bitable.base.getTableById(selection.tableId);
    const name = await table.getName();

    const isTableType = (name: string): name is TableType => {
      return tableNames.some((tableName) => {
        return tableName === name;
      });
    };

    console.log("table: ", table);
    setErrorMsg(null);

    if (!name || !isTableType(name)) {
      return;
    }

    const apiPath = tableConfig[name].apiPath;

    if (!apiPath) {
      setErrorMsg("当前表格没有对应上传配置");
      return;
    }
    fetch(`${SERVICE_ORIGIN}${apiPath}`, {
      method: "POST",
      body: JSON.stringify({
        app_token: selection.baseId,
        table_id: selection.tableId,
        view_id: selection.viewId,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        console.log("res: ", res);

        if (res.code === 1) {
          setErrorMsg("请检查表格内容");
        } else if (
          res.data &&
          res.data instanceof Object &&
          Object.keys(res.data).length
        ) {
          const reactNodes = Object.entries(res.data).map(([code, msg]) => {
            return (
              <span>
                code {code}： {msg as string}
              </span>
            );
          });
          setErrorMsg(reactNodes);
        } else {
          setErrorMsg(res.msg);
        }
      })
      .catch((err) => {
        console.log("err: ", err);
      });
  };

  return (
    <main>
      <h3 className="title">当前选中表格：{curTable.name}</h3>

      {isCheckable ? (
        <>
          <div className="form-item">
            <label>选择编号字段：</label>

            <select
              className="select"
              value={codeFieldName}
              onChange={(e) => {
                console.log("e: ", e);
                setCodeFieldName(e.target.value);
              }}
            >
              {codeFieldList?.length
                ? codeFieldList.map((field) => (
                    <option value={field.id} label={field.name} key={field.id}>
                      {field.name}
                    </option>
                  ))
                : null}
            </select>
          </div>
          <div className="template-check-wrapper">
            <fieldset>
              <legend>选择要校验的模版编号:</legend>
              {templateList.map((item) => (
                <div key={item.record_id} className="template-check-item">
                  <input
                    type="radio"
                    id={item.value.value}
                    name={item.value.value}
                    checked={selectedCode === item.value.value}
                    onChange={() => {
                      setSelectedCode(item.value.value);
                    }}
                  />
                  <label htmlFor={item.value.value}>{item.value.value}</label>
                </div>
              ))}
            </fieldset>

            <button
              className={classNames("export-btn", {
                loading: isChecking,
              })}
              disabled={!selectedCode}
              onClick={handleCheck}
            >
              {isChecking ? (
                <img
                  src="https://nolipix-js.nolibox.com/custom/image/board_image_loading.png"
                  className="button-loading-icon"
                />
              ) : null}
              {isChecking ? "检查中..." : `检查模版 ${selectedCode}`}
            </button>

            {checkTemplatePreview ? (
              <img src={checkTemplatePreview} className="template-preview" />
            ) : null}

            {checkError ? (
              <p className="tip">
                检查模版失败，错误信息如下：
                <br />
                {checkError}
              </p>
            ) : null}

            <hr className="divider" />
          </div>
        </>
      ) : null}

      {Boolean(tableConfig[curTable.name as TableType]?.apiPath) ? (
        <button className="export-btn" onClick={handleUploadTable}>
          上传表格内容
        </button>
      ) : (
        <p className="tip info">当前表格没有对应上传接口</p>
      )}
      {errorMsg ? (
        <p className="tip">
          上传失败，错误信息如下：
          <br />
          {errorMsg}
        </p>
      ) : null}
    </main>
  );
}
