<template>
  <div>
    <!-- 配置项的各分支值 -->
    <a-table
      :columns="columns"
      rowKey="Id"
      :dataSource="logs"
      @change="changePage"
      :pagination="pagination"
    >
      <span slot="Action" slot-scope="text">
        <a-tag :color="text=='update'?'blue':'red'">{{text}}</a-tag>
      </span>
      <span slot="Before" slot-scope="text,record" style="white-space:pre-wrap">{{record.Before}}</span>
      <span slot="After" slot-scope="text,record" style="white-space:pre-wrap">{{record.After}}</span>
    </a-table>
    <!-- 配置项的各分支值 -->
  </div>
</template>
<script>
let projects = {};
const columns = [
  {
    title: "操作人",
    dataIndex: "Who"
  },
  {
    title: "项目",
    dataIndex: "Project",
    customRender(text, record) {
      let project = projects[record.ProjectId];
      return project ? project.Name : "-";
    }
  },
  {
    title: "配置名",
    dataIndex: "Key"
  },
  {
    title: "IP",
    dataIndex: "Ip"
  },
  {
    title: "行为",
    dataIndex: "Action",
    scopedSlots: {
      customRender: "Action"
    }
  },
  {
    title: "日期",
    dataIndex: "Time",
    customRender(text, record) {
      let date = new Date(record.Time * 1000);
      return `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
    }
  },
  {
    title: "修改前",
    dataIndex: "Before",
    width: 300,
    scopedSlots: {
      customRender: "Before"
    }
  },
  {
    title: "修改后",
    dataIndex: "After",
    width: 300,
    scopedSlots: {
      customRender: "After"
    }
  }
];
import config from "@/config";
import axios from "axios";
export default {
  data() {
    return {
      columns,
      page: 1,
      total: 0,
      projects: [],
      logData: []
    };
  },
  mounted() {
    this.loadProjects();
  },
  computed: {
    pagination() {
      return {
        total: this.total,
        pageSize: 20
      };
    },
    logs() {
      return this.logData.map(v => {
        v.Json = JSON.parse(v.Data);
        v.ProjectId = v.Json.before.ProjectId;
        v.Key = v.Json.before.Key;

        if (v.Json.before) {
          delete v.Json.before.Id;
          delete v.Json.before.ProjectId;
          delete v.Json.before.Key;
        }
        if (v.Json.after) {
          delete v.Json.after.Id;
          delete v.Json.after.ProjectId;
          delete v.Json.after.Key;
        }
        v.Before = JSON.stringify(v.Json.before, "", 4);
        v.After = JSON.stringify(v.Json.after, "", 4);

        return v;
      });
    }
  },
  methods: {
    changePage({ current }) {
      this.page = current;
      this.loadLogs();
    },
    loadProjects() {
      axios
        .get(config["gitlab-config-server.domain"] + "/v1/project")
        .then(resp => {
          let map = {};
          resp.data.data.forEach(v => {
            map[v.Id] = v;
          });
          projects = map;
          this.loadLogs();
        });
    },
    loadLogs() {
      axios
        .get(
          config["gitlab-config-server.domain"] + "/v1/log?page=" + this.page
        )
        .then(resp => {
          this.logData = resp.data.data;
          this.total = resp.data.total;
        });
    }
  }
};
</script>
