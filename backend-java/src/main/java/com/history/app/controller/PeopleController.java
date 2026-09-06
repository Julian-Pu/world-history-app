package com.history.app.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.history.app.common.Result;
import com.history.app.entity.Person;
import com.history.app.entity.PersonRelation;
import com.history.app.mapper.PersonMapper;
import com.history.app.mapper.PersonRelationMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 历史人物模块
 * 与 Node.js 版 /api/people 接口完全一致
 */
@RestController
@RequestMapping("/api/people")
@Tag(name = "历史人物", description = "人物列表、详情、关系网络图谱")
public class PeopleController {

    @Autowired
    private PersonMapper personMapper;

    @Autowired
    private PersonRelationMapper relationMapper;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // 关系类型对应的颜色
    private static final Map<String, String> RELATION_COLORS = Map.ofEntries(
            Map.entry("君臣", "#FFD700"),
            Map.entry("师生", "#32CD32"),
            Map.entry("对手", "#FF4500"),
            Map.entry("政敌", "#DC143C"),
            Map.entry("父子", "#4169E1"),
            Map.entry("兄弟", "#1E90FF"),
            Map.entry("夫妻", "#FF69B4"),
            Map.entry("祖孙", "#8A2BE2"),
            Map.entry("朋友", "#20B2AA"),
            Map.entry("盟友", "#00CED1"),
            Map.entry("反叛", "#B22222"),
            Map.entry("继承", "#DAA520"),
            Map.entry("同学", "#87CEEB"),
            Map.entry("同时代思想家", "#9370DB"),
            Map.entry("其他", "#808080")
    );

    @GetMapping
    @Operation(summary = "获取人物列表")
    public Result<Map<String, Object>> getPeople(
            @RequestParam(required = false) String dynasty,
            @RequestParam(required = false) String region,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "20") Integer limit) {

        LambdaQueryWrapper<Person> wrapper = new LambdaQueryWrapper<>();
        if (dynasty != null) wrapper.eq(Person::getDynasty, dynasty);
        if (region != null) wrapper.eq(Person::getRegion, region);
        if (role != null) wrapper.eq(Person::getRole, role);
        if (keyword != null) wrapper.like(Person::getName, keyword);

        Page<Person> pageResult = personMapper.selectPage(new Page<>(page, limit), wrapper);

        Map<String, Object> result = new HashMap<>();
        result.put("list", pageResult.getRecords());
        Map<String, Object> pagination = new HashMap<>();
        pagination.put("page", pageResult.getCurrent());
        pagination.put("limit", pageResult.getSize());
        pagination.put("total", pageResult.getTotal());
        pagination.put("total_pages", pageResult.getPages());
        result.put("pagination", pagination);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    @Operation(summary = "获取人物详情")
    public Result<Map<String, Object>> getPersonDetail(@PathVariable String id) {
        Person person = personMapper.selectById(id);
        if (person == null) {
            return Result.error("人物不存在", "NOT_FOUND");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", person.getId());
        result.put("name", person.getName());
        result.put("dynasty", person.getDynasty());
        result.put("region", person.getRegion());
        result.put("role", person.getRole());
        result.put("birth_year", person.getBirthYear());
        result.put("death_year", person.getDeathYear());
        result.put("level_contents", parseJson(person.getLevelContents()));

        // 查询人物关系
        List<PersonRelation> relations = relationMapper.selectList(
                new LambdaQueryWrapper<PersonRelation>()
                        .eq(PersonRelation::getPersonId, id)
                        .or()
                        .eq(PersonRelation::getRelatedPersonId, id));

        List<Map<String, Object>> relationList = relations.stream().map(r -> {
            Map<String, Object> item = new HashMap<>();
            String relatedId = r.getPersonId().equals(id) ? r.getRelatedPersonId() : r.getPersonId();
            Person related = personMapper.selectById(relatedId);
            item.put("related_person_id", relatedId);
            item.put("related_person_name", related != null ? related.getName() : "未知");
            item.put("relation_type", r.getRelationType());
            item.put("description", r.getDescription());
            return item;
        }).collect(Collectors.toList());

        result.put("relations", relationList);
        return Result.success(result);
    }

    @GetMapping("/network/graph")
    @Operation(summary = "获取人物关系网络图谱")
    public Result<Map<String, Object>> getNetworkGraph(
            @RequestParam(required = false) String dynasty,
            @RequestParam(defaultValue = "0") Integer minRelations) {

        // 查询所有人物
        LambdaQueryWrapper<Person> personWrapper = new LambdaQueryWrapper<>();
        if (dynasty != null) personWrapper.eq(Person::getDynasty, dynasty);
        List<Person> people = personMapper.selectList(personWrapper);
        Set<String> personIds = people.stream().map(Person::getId).collect(Collectors.toSet());

        // 查询所有关系
        List<PersonRelation> allRelations = relationMapper.selectList(null);

        // 统计每个人的关系数
        Map<String, Integer> relationCount = new HashMap<>();
        for (PersonRelation r : allRelations) {
            if (personIds.contains(r.getPersonId())) {
                relationCount.merge(r.getPersonId(), 1, Integer::sum);
            }
            if (personIds.contains(r.getRelatedPersonId())) {
                relationCount.merge(r.getRelatedPersonId(), 1, Integer::sum);
            }
        }

        // 按朝代分类
        List<String> dynasties = people.stream()
                .map(Person::getDynasty)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<String, Integer> dynastyIndex = new HashMap<>();
        for (int i = 0; i < dynasties.size(); i++) {
            dynastyIndex.put(dynasties.get(i), i);
        }

        // 构建节点
        List<Map<String, Object>> nodes = people.stream()
                .filter(p -> relationCount.getOrDefault(p.getId(), 0) >= minRelations)
                .map(p -> {
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", p.getId());
                    node.put("name", p.getName());
                    node.put("dynasty", p.getDynasty());
                    node.put("category", dynastyIndex.getOrDefault(p.getDynasty(), 0));
                    int count = relationCount.getOrDefault(p.getId(), 0);
                    node.put("symbolSize", 30 + count * 5);
                    node.put("value", count);
                    return node;
                })
                .collect(Collectors.toList());

        Set<String> validNodeIds = nodes.stream().map(n -> (String) n.get("id")).collect(Collectors.toSet());

        // 构建边
        List<Map<String, Object>> links = allRelations.stream()
                .filter(r -> validNodeIds.contains(r.getPersonId()) && validNodeIds.contains(r.getRelatedPersonId()))
                .map(r -> {
                    Map<String, Object> link = new HashMap<>();
                    link.put("source", r.getPersonId());
                    link.put("target", r.getRelatedPersonId());
                    link.put("relation_type", r.getRelationType());
                    link.put("description", r.getDescription());
                    Map<String, Object> lineStyle = new HashMap<>();
                    lineStyle.put("color", RELATION_COLORS.getOrDefault(r.getRelationType(), "#808080"));
                    link.put("lineStyle", lineStyle);
                    return link;
                })
                .collect(Collectors.toList());

        // 构建分类
        List<Map<String, String>> categories = dynasties.stream()
                .map(d -> {
                    Map<String, String> cat = new HashMap<>();
                    cat.put("name", d);
                    return cat;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("links", links);
        result.put("categories", categories);
        return Result.success(result);
    }

    @PostMapping("/relations")
    @Operation(summary = "添加人物关系")
    public Result<Void> addRelation(@RequestBody PersonRelation relation) {
        relationMapper.insert(relation);
        return Result.success("添加成功");
    }

    @PostMapping("/batch")
    @Operation(summary = "批量导入人物")
    public Result<Map<String, Object>> batchImportPeople(@RequestBody Map<String, List<Person>> body) {
        List<Person> people = body.get("people");
        int count = 0;
        for (Person p : people) {
            try {
                personMapper.insert(p);
                count++;
            } catch (Exception e) {
                // 忽略重复
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("imported", count);
        result.put("total", people.size());
        return Result.success("导入完成", result);
    }

    @PostMapping("/relations/batch")
    @Operation(summary = "批量导入人物关系")
    public Result<Map<String, Object>> batchImportRelations(@RequestBody Map<String, List<PersonRelation>> body) {
        List<PersonRelation> relations = body.get("relations");
        int count = 0;
        for (PersonRelation r : relations) {
            try {
                relationMapper.insert(r);
                count++;
            } catch (Exception e) {
                // 忽略重复
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("imported", count);
        result.put("total", relations.size());
        return Result.success("导入完成", result);
    }

    private Map<String, Object> parseJson(String json) {
        if (json == null || json.isEmpty()) return new HashMap<>();
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
}
