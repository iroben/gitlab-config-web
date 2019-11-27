<template>
  <div>
    <a-card>
      <span slot="title">项目：
        <!-- 项目信息 -->
        <a-select
          :value="project ? project.Id : '' "
          showSearch
          style="width: 400px"
          placeholder="请选择项目"
          :filterOption="false"
          @search="filterOption"
          @change="handleChangeCheck"
        >
          <a-select-opt-group :label="group.Name" v-for="group in projects" :key="group.Name">
            <a-select-option v-for="_project in group.Projects" :key="_project.Id">
              {{_project.Name}}
              <template v-if="_project.Description">({{_project.Description}})</template>
            </a-select-option>
          </a-select-opt-group>
        </a-select>
        <!-- 项目信息 -->
        <a-popconfirm
          title="是否自动依赖部署？"
          @confirm="saveAndDeploy"
          @cancel="save"
          okText="是"
          cancelText="否"
        >
          <a-button class="btn" type="primary" icon="save">保存</a-button>
        </a-popconfirm>
        <a-button :disabled="!project" class="btn" type="dashed" @click="upload" icon="upload">导入</a-button>
        <a-button
          :disabled="!project || !yaml"
          class="btn"
          type="dashed"
          @click="copy"
          icon="export"
          id="copy_yaml"
          :data-clipboard-text="yaml"
        >导出</a-button>
      </span>
    </a-card>
    <!-- 配置信息 -->
    <a-card class="configitem" v-for="config in configs" :key="config.Id">
      <span slot="title">
        {{config.Key}}：
        <template v-if="config.editable">
          <a-input
            v-if="config.editable"
            style="margin: -5px 0;width:400px;"
            :defaultValue="config.Description"
            @change="e => configChange(e.target.value, 'description',config)"
          />
        </template>
        <template v-else>{{config.Description}}</template>
      </span>
      <!-- 右上角按钮 -->
      <span slot="extra">
        <template v-if="hasPermission">
          <template v-if="config.editable">
            <a-button class="btn" icon="edit" @click="tempSave(config)">暂存</a-button>
            <a-button class="btn" icon="rollback" @click="cancelEdit(config)"></a-button>
          </template>
          <template v-else>
            <a-button class="btn" icon="edit" @click="edit(config)"></a-button>
            <a-popconfirm
              title="确定要删除配置？"
              @confirm="()=>removeConfig(config)"
              okText="是"
              cancelText="否"
            >
              <a-button class="btn" type="danger" icon="delete"></a-button>
            </a-popconfirm>
          </template>
        </template>
      </span>
      <!-- 右上角按钮 -->
      <!-- 配置项的各分支值 -->
      <a-table
        :columns="columns"
        :dataSource="config.branchConfig"
        rowKey="branch"
        :pagination="false"
      >
        <span slot="branch" slot-scope="text,record,index" style="text-align:right">
          <a-tag
            :color="['red','green','purple','pink','blue','orange','cyan','#f50','#2db7f5','#87d068', '#108ee9'][index%11]"
          >{{text}}</a-tag>
        </span>
        <template slot="val" slot-scope="text,record">
          <a-input
            v-if="config.editable"
            style="margin: -5px 0"
            :defaultValue="text"
            @change="e => configChange(e.target.value, record.branch,config)"
          />
          <template v-else>{{text}}</template>
        </template>
      </a-table>
      <!-- 配置项的各分支值 -->
    </a-card>
    <!-- 配置信息 -->
    <a-modal
      title="导入配置"
      v-model="visible"
      cancelText="取消"
      okText="导入"
      :closable="false"
      @ok="handleOk"
    >
      <a-textarea
        v-model="uploadTxt"
        placeholder="
            配置格式：
            ----------
            master:
              key1: value1
              key2: value2
            test:
              key1: value1
              key2: value2
            dev:
              key1: value1
              key2: value2"
        :rows="15"
      />
    </a-modal>
  </div>
</template>

<script>
const columns = [
  {
    title: "分支",
    dataIndex: "branch",
    width: 200,
    align: "right",
    scopedSlots: { customRender: "branch" },
    key: "branch"
  },
  {
    title: "值",
    dataIndex: "val",
    scopedSlots: { customRender: "val" }
  }
];
var clock;
import config from "@/config";
import axios from "axios";
import { Modal, notification } from "ant-design-vue";
import yaml from "yaml";
import Clipboard from "clipboard";
import { setTimeout, clearTimeout } from "timers";
export default {
  data() {
    return {
      columns,
      uploadTxt: "",
      searchTxt: "",
      projectData: [],
      configData: [],
      project: null,
      visible: false,
      changed: {},
      hasPermission: false,
      lastEditConfig: null //记录最后编辑的配置项，只能同时编辑一个配置
    };
  },
  computed: {
    yaml() {
      if (this.configData.length === 0) {
        return;
      }

      return yaml.stringify({
        [this.project.Name]: this.configData.map(v => v.Key)
      });
    },
    projects() {
      let gitlabNameSpace = {};
      this.projectData.forEach(project => {
        gitlabNameSpace[project.Group] = true;
      });
      let retVal = [];
      Object.keys(gitlabNameSpace).forEach(group => {
        let groupProjects = [];
        this.projectData.forEach(project => {
          if (project.Group !== group) {
            return;
          }
          if (this.searchTxt !== "" && !project.Name.includes(this.searchTxt)) {
            return;
          }
          groupProjects.push(project);
        });
        if (groupProjects.length > 0) {
          retVal.push({
            Name: group,
            Projects: groupProjects
          });
        }
      });
      return retVal;
    },
    configs() {
      if (!this.project) {
        return [];
      }
      let branches = this.project.Branches;
      let hasTag = this.project.Tags && this.project.Tags.length > 0;
      let data = this.configData.map(v => {
        let branchConfig = [];
        v.Val = v.Val || [];
        this.$set(v, "editable", false);
        branches.forEach(branch => {
          branchConfig.push({
            branch,
            val: v.Val[branch] || ""
          });
        });
        if (hasTag) {
          branchConfig.push({
            branch: "tag",
            val: v.Val.tag || ""
          });
        }
        this.$set(v, "branchConfig", branchConfig);
        // 用来临时保存修改的数据
        v.changed = {};
        return v;
      });
      return data;
    }
  },
  mounted() {
    this.loadProjects();
    this.initClipboard();
  },
  methods: {
    initClipboard() {
      let clip = new Clipboard("#copy_yaml");
      clip.on("success", e => {
        e.clearSelection();
        notification.success({
          message: "系统提示",
          description: "复制成功",
          duration: 2
        });
      });

      clip.on("error", e => {
        notification.error({
          message: "系统提示",
          description: "复制失败",
          duration: 2
        });
      });
    },
    edit(config) {
      // 保存正在编辑的配置
      if (this.lastEditConfig) {
        this.tempSave(this.lastEditConfig);
      }
      config.editable = true;
      this.lastEditConfig = config;
    },
    cancelEdit(config) {
      config.editable = false;
      this.lastEditConfig = null;
    },
    configChange(val, key, config) {
      config.changed[key] = val;
    },
    tempSave(config) {
      if (Object.keys(config.changed).length > 0) {
        config.branchConfig.forEach(v => {
          let branch = v.branch;
          let changed = config.changed;
          if (branch in changed && changed[branch] !== v.val) {
            //内容修改过了
            this.changed[config.Id] = this.changed[config.Id] || { val: {} };
            this.changed[config.Id].val[branch] = v.val = changed[branch];
          }
        });
        if ("description" in config.changed) {
          this.changed[config.Id] = this.changed[config.Id] || {};
          config.Description = this.changed[config.Id].description =
            config.changed.description;
        }
      }
      config.editable = false;
    },
    filterOption(input) {
      if (clock) {
        clearTimeout(clock);
      }
      clock = setTimeout(() => {
        this.searchTxt = input;
      }, 100);
    },
    loadProjects() {
      axios
        .get(config["gitlab-config-server.domain"] + "/v1/project")
        .then(resp => {
          this.projectData = resp.data.data;
        });
    },
    loadConfig(projectId) {
      axios
        .get(
          config["gitlab-config-server.domain"] + "/v1/config?pid=" + projectId
        )
        .then(resp => {
          this.configData = resp.data.data;
          this.hasPermission = resp.data.hasPermission;
        });
    },
    handleChangeCheck(pId) {
      if (this.lastEditConfig) {
        this.tempSave(this.lastEditConfig);
      }
      if (Object.keys(this.changed).length > 0) {
        Modal.confirm({
          title: "系统提示",
          content: "你有配置未保存，是否保存？",
          okText: "检查一下",
          cancelText: "放弃",
          onOk: () => {},
          onCancel: () => {
            this.handleChange(pId);
          }
        });
        return;
      }
      this.handleChange(pId);
    },
    handleChange(pId) {
      this.projectData.forEach(v => {
        if (v.Id == pId) {
          this.project = v;
        }
      });

      // 切换项目后，重置缓存数据
      this.changed = {};
      this.loadConfig(this.project.Id);
    },
    handleOk() {
      this.visible = false;
      if (!this.project) {
        return;
      }
      const params = new URLSearchParams();
      params.append("project_id", this.project.Id);
      params.append("yml", this.uploadTxt);
      axios
        .post(config["gitlab-config-server.domain"] + "/v1/config/yml", params)
        .then(resp => {
          this.loadConfig(this.project.Id);
        });
    },
    upload() {
      this.uploadTxt = "";
      this.visible = true;
    },
    copy() {},
    saveAndDeploy() {
      this.updateConfig(1);
    },
    save() {
      this.updateConfig(0);
    },
    updateConfig(dependent) {
      if (this.lastEditConfig) {
        this.tempSave(this.lastEditConfig);
        this.lastEditConfig = null;
      }
      axios
        .put(
          config["gitlab-config-server.domain"] +
            "/v1/config?dependent=" +
            dependent,
          this.changed
        )
        .then(resp => {
          this.changed = {};
          this.loadConfig(this.project.Id);
        });
    },
    removeConfig(configItem) {
      axios
        .delete(
          config["gitlab-config-server.domain"] +
            "/v1/config?id=" +
            configItem.Id
        )
        .then(resp => {
          this.configData.forEach((v, index) => {
            if (v.Id === configItem.Id) {
              this.configData.splice(index, 1);
            }
          });
        });
    }
  }
};
</script>
<style>
.btn {
  min-width: 50px;
  margin-left: 10px;
}
.configitem {
  margin-top: 10px;
}
</style>


