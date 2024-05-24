import { ReactNode, useEffect, useState } from "react";
import "./App.css";
import { IOpenAutoNumber, ITable, bitable } from "@lark-base-open/js-sdk";
import classNames from "classnames";

const serviceAPI = "https://gw.test.newdesigner.ai/designer-service";
const tableNames = ["模版", "预设(IPAdapter)", "风格"] as const;
type TableType = (typeof tableNames)[number];
const tableConfig: Record<
  TableType,
  {
    apiPath: string;
  }
> = {
  模版: {
    apiPath: "/tool/template",
  },
  "预设(IPAdapter)": {
    apiPath: "/tool/preset",
  },
  风格: {
    apiPath: "/tool/style",
  },
};

const APICheckTemplate = `${serviceAPI}/tool/check/template`;
export default function App() {
  const [curTable, setCurTable] = useState<{
    id: string;
    name: string;
    table: ITable | null;
  }>({
    id: "",
    name: "",
    table: null,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [templateList, setTemplateList] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");

  console.log("curTable: ", curTable);
  // upload
  const [errorMsg, setErrorMsg] = useState<ReactNode>(null);
  // check
  const [checkTemplatePreview, setCheckTemplatePreview] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  console.log("isChecking: ", isChecking);
  const [checkError, setCheckError] = useState("");

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
    const codeField = await table.getFieldByName("code");
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

  async function init() {
    const tableData = await getTableData(null);
    if (tableData) {
      setCurTable(tableData);
      getTemplateCodes(tableData.table);
    }
  }

  useEffect(() => {
    init();
    const off = bitable.base.onSelectionChange(async (event) => {
      const data = event.data;
      const tableData = await getTableData(data.tableId);
      if (tableData) {
        setCurTable(tableData);
        reset();
      }
    });

    return () => {
      off();
    };
  }, []);

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

  const process = async () => {
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

    fetch(`${serviceAPI}${apiPath}`, {
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
        } else if (res.data) {
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

      {curTable.name === "模版" ? (
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
            onClick={async () => {
              if (isChecking) return;
              setIsChecking(true);
              setCheckError("");
              setCheckTemplatePreview("");
              const selection = await bitable.base.getSelection();

              fetch(APICheckTemplate, {
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
            }}
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
      ) : null}

      <button className="export-btn" onClick={process}>
        上传表格内容
      </button>
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
