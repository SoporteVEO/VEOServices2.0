import { Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { AgentColumn, AgentPdfTable } from "@/api/agent/agent.types";
import { formatAgentValue, isNumericFormat } from "@/lib/agent-format";
import { pdfStyles } from "./agent-pdf-styles";

/** Text columns get more room than figures, which stay narrow and scannable. */
function columnStyle(column: AgentColumn): Style {
  const numeric = isNumericFormat(column.format);
  return {
    flex: numeric || column.format === "date" ? 1 : 1.8,
    textAlign: numeric ? "right" : "left",
  };
}

export function AgentPdfTableBlock({ table }: { table: AgentPdfTable }) {
  const totals = table.totals;

  return (
    <View>
      <View style={pdfStyles.tableHeader} wrap={false} minPresenceAhead={40}>
        {table.columns.map((column) => (
          <Text
            key={column.key}
            style={[pdfStyles.tableHeaderCell, columnStyle(column)]}
          >
            {column.label}
          </Text>
        ))}
      </View>
      {table.rows.map((row, index) => (
        <View
          key={index}
          wrap={false}
          style={[
            pdfStyles.tableRow,
            index % 2 === 1 ? pdfStyles.tableRowStriped : {},
          ]}
        >
          {table.columns.map((column) => (
            <Text
              key={column.key}
              style={[pdfStyles.tableCell, columnStyle(column)]}
            >
              {formatAgentValue(row[column.key], column.format)}
            </Text>
          ))}
        </View>
      ))}
      {totals ? (
        <View style={pdfStyles.tableTotals} wrap={false}>
          {table.columns.map((column, index) => {
            const value = totals[column.key];
            const text =
              value === undefined || value === null || value === ""
                ? index === 0
                  ? "Total"
                  : ""
                : formatAgentValue(value, column.format);
            return (
              <Text
                key={column.key}
                style={[pdfStyles.tableTotalsCell, columnStyle(column)]}
              >
                {text}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
